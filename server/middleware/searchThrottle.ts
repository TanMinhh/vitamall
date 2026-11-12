import { NextFunction, Request, Response } from "express";

const WINDOW_MS = 1_000;
const MAX_REQUESTS = 3;
const MAX_QUERY_LENGTH = 100;

type RequestWindow = {
    requests: number[];
};

const requestWindows = new Map<string, RequestWindow>();

const cleanupExpiredWindows = () => {
    const now = Date.now();
    for (const [key, window] of requestWindows) {
        window.requests = window.requests.filter((timestamp) => now - timestamp < WINDOW_MS);
        if (window.requests.length === 0) requestWindows.delete(key);
    }
};

const cleanupTimer = setInterval(cleanupExpiredWindows, WINDOW_MS);
cleanupTimer.unref();

const getClientKey = (req: Request) => `search:${req.user?.id || req.ip}`;

const searchThrottle = (req: Request, res: Response, next: NextFunction) => {
    const rawSearch = req.query.search;
    if (rawSearch === undefined) {
        next();
        return;
    }

    if (typeof rawSearch !== "string") {
        res.status(400).json({ message: "Search query must be a single value." });
        return;
    }

    const search = rawSearch.trim();
    if (search.length > MAX_QUERY_LENGTH) {
        res.status(400).json({ message: `Search query must be ${MAX_QUERY_LENGTH} characters or fewer.` });
        return;
    }

    const now = Date.now();
    const clientKey = getClientKey(req);
    const requestWindow = requestWindows.get(clientKey) || { requests: [] };
    requestWindow.requests = requestWindow.requests.filter((timestamp) => now - timestamp < WINDOW_MS);

    if (requestWindow.requests.length >= MAX_REQUESTS) {
        res.setHeader("Retry-After", "1");
        res.status(429).json({ message: "Too many search requests. Please try again shortly." });
        return;
    }

    requestWindow.requests.push(now);
    requestWindows.set(clientKey, requestWindow);
    next();
};

export default searchThrottle;
