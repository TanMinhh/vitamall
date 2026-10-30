import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

const getOrderItem = (items: unknown, productId: string) => {
    if (!Array.isArray(items)) return undefined;
    return items.find((item: any) => item?.product === productId);
};

export const getProductReviews = async (req: Request, res: Response) => {
    const reviews = await prisma.review.findMany({
        where: { productId: req.params.id as string },
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
    });
    const helpfulVotes = req.user
        ? await prisma.helpfulVote.findMany({ where: { userId: req.user.id, reviewId: { in: reviews.map((review) => review.id) } }, select: { reviewId: true } })
        : [];
    const votedReviewIds = new Set(helpfulVotes.map((vote) => vote.reviewId));
    const helpfulCounts = await prisma.helpfulVote.groupBy({
        by: ["reviewId"],
        where: { reviewId: { in: reviews.map((review) => review.id) } },
        _count: { _all: true },
    });
    const countByReviewId = new Map(helpfulCounts.map((count) => [count.reviewId, count._count._all]));
    res.json({
        reviews: reviews.map((review) => ({
            ...review,
            helpful: countByReviewId.get(review.id) ?? 0,
            helpfulByCurrentUser: votedReviewIds.has(review.id),
        })),
    });
};

export const toggleHelpfulVote = async (req: Request, res: Response) => {
    const review = await prisma.review.findUnique({
        where: { id: req.params.reviewId as string },
        select: { id: true, userId: true },
    });
    if (!review) return res.status(404).json({ message: "Review not found." });
    if (review.userId === req.user!.id) return res.status(403).json({ message: "You cannot vote on your own review." });

    await prisma.$transaction(async (transaction) => {
        const existingVote = await transaction.helpfulVote.findUnique({
            where: { userId_reviewId: { userId: req.user!.id, reviewId: review.id } },
        });
        if (existingVote) {
            await transaction.helpfulVote.delete({ where: { id: existingVote.id } });
        } else {
            await transaction.helpfulVote.create({ data: { userId: req.user!.id, reviewId: review.id } });
        }
    });
    const helpful = await prisma.helpfulVote.count({ where: { reviewId: review.id } });
    res.json({ helpful, helpfulByCurrentUser: !!(await prisma.helpfulVote.findUnique({ where: { userId_reviewId: { userId: req.user!.id, reviewId: review.id } } })) });
};

export const getProductReviewStatus = async (req: Request, res: Response) => {
    const productId = req.params.id as string;
    const [orders, review] = await Promise.all([
        prisma.order.findMany({
            where: {
                userId: req.user!.id,
                status: "Delivered",
                NOT: [{ paymentMethod: "card", isPaid: false }],
            },
            select: { id: true, items: true },
            orderBy: { createdAt: "desc" },
        }),
        prisma.review.findFirst({
            where: { userId: req.user!.id, productId },
            select: { id: true, rating: true, text: true, orderId: true },
        }),
    ]);

    res.json({
        eligible: !!orders.find((order) => getOrderItem(order.items, productId)),
        orderId: orders.find((order) => getOrderItem(order.items, productId))?.id ?? null,
        review,
    });
};

export const createProductReview = async (req: Request, res: Response) => {
    const { orderId, rating, text } = req.body;
    const numericRating = Number(rating);
    const reviewText = typeof text === "string" ? text.trim() : "";

    if (!orderId || !reviewText || !Number.isInteger(numericRating) || numericRating < 0 || numericRating > 5) {
        return res.status(400).json({ message: "Review text, an order, and a rating from 0 to 5 are required." });
    }

    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            userId: req.user!.id,
            status: "Delivered",
            NOT: [{ paymentMethod: "card", isPaid: false }],
        },
        select: { id: true, items: true },
    });
    if (!order || !getOrderItem(order.items, req.params.id as string)) {
        return res.status(403).json({ message: "You can only review products from your delivered orders." });
    }

    const review = await prisma.$transaction(async (transaction) => {
        const existingReview = await transaction.review.findFirst({
            where: { userId: req.user!.id, productId: req.params.id as string },
            select: { id: true },
        });
        const savedReview = existingReview
            ? await transaction.review.update({
                where: { id: existingReview.id },
                data: { rating: numericRating, text: reviewText, orderId },
                include: { user: { select: { id: true, name: true, avatar: true } } },
            })
            : await transaction.review.create({
                data: { userId: req.user!.id, productId: req.params.id as string, orderId, rating: numericRating, text: reviewText },
                include: { user: { select: { id: true, name: true, avatar: true } } },
            });
        const aggregate = await transaction.review.aggregate({
            where: { productId: req.params.id as string },
            _avg: { rating: true },
            _count: { _all: true },
        });
        await transaction.product.update({
            where: { id: req.params.id as string },
            data: {
                rating: aggregate._avg.rating ?? 0,
                reviewCount: aggregate._count._all,
            },
        });
        return savedReview;
    });

    res.status(201).json({ review });
};
