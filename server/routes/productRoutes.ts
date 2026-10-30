import express from "express";
import { createProduct, deleteProduct, getFlashDeals, getProduct, getProducts, updateProduct } from "../controllers/productController.js";
import { createProductReview, getProductReviewStatus, getProductReviews, toggleHelpfulVote } from "../controllers/reviewController.js";
import auth from "../middleware/auth.js";
import optionalAuth from "../middleware/optionalAuth.js";
import admin from "../middleware/admin.js";

const productRouter = express.Router();

productRouter.get("/flash-deals", getFlashDeals);
productRouter.get("/", getProducts);
productRouter.get("/:id/reviews", optionalAuth, getProductReviews);
productRouter.post("/reviews/:reviewId/helpful", auth, toggleHelpfulVote);
productRouter.get("/:id/review-status", auth, getProductReviewStatus);
productRouter.get("/:id", getProduct);
productRouter.post("/:id/reviews", auth, createProductReview);
productRouter.post("/", auth, admin, createProduct);
productRouter.put("/:id", auth, admin, updateProduct);
productRouter.delete("/:id", auth, admin, deleteProduct);

export default productRouter;