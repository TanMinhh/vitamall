import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { categoriesData } from "../../assets/assets"

const HomeCategories = () => {
    const scrollRef = useRef<HTMLDivElement | null>(null)
    const itemRefs = useRef<Array<HTMLAnchorElement | null>>([])
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    const updateScrollState = () => {
        const container = scrollRef.current

        if (!container) return

        const { scrollLeft, scrollWidth, clientWidth } = container
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
    }

    useEffect(() => {
        updateScrollState()

        const container = scrollRef.current
        if (!container) return

        container.addEventListener("scroll", updateScrollState, { passive: true })

        const resizeObserver = new ResizeObserver(updateScrollState)
        resizeObserver.observe(container)

        return () => {
            container.removeEventListener("scroll", updateScrollState)
            resizeObserver.disconnect()
        }
    }, [])

    const scrollCategories = (direction: "left" | "right") => {
        const container = scrollRef.current
        if (!container) return

        const items = itemRefs.current.filter((item): item is HTMLAnchorElement => item !== null)

        if (items.length === 0) return

        const step = Math.max(1, items[1]?.offsetLeft - items[0].offsetLeft || items[0].offsetWidth)

        container.scrollBy({
            left: direction === "right" ? step : -step,
            behavior: "smooth",
        })
    }

    return (
        <section className="py-16">
            <div className="max-w-7xl mx-auto">
                <div>
                    <div>
                        <h2 className="text-2xl font-semibold">Browse Categories</h2>
                        <p className="text-sm text-app-text-light mt-1">Find exactly what you need using</p>
                    </div>
                </div>
                <div className="relative mt-8">
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-16 bg-gradient-to-r from-app-cream to-transparent sm:block" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-16 bg-gradient-to-l from-app-cream to-transparent sm:block" />
                    <button
                        type="button"
                        onClick={() => scrollCategories("left")}
                        disabled={!canScrollLeft}
                        aria-label="Scroll categories left"
                        className="absolute left-0 top-1/2 z-20 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-app-border bg-white/95 shadow-sm text-app-text hover:bg-app-cream disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="size-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollCategories("right")}
                        disabled={!canScrollRight}
                        aria-label="Scroll categories right"
                        className="absolute right-0 top-1/2 z-20 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-app-border bg-white/95 shadow-sm text-app-text hover:bg-app-cream disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="size-5" />
                    </button>
                    <div ref={scrollRef} className="flex items-center gap-2 overflow-x-auto scroll-smooth no-scrollbar px-14 pb-2">
                        {categoriesData.map((categories, index) => (
                            <Link
                                key={categories.slug}
                                ref={(element) => {
                                    itemRefs.current[index] = element
                                }}
                                to={`/products?category=${categories.slug}`}
                                onClick={() => window.scrollTo(0, 0)}
                                className="group flex shrink-0 flex-col items-center gap-3 p-4"
                            >
                                <div className="size-18 sm:size-30 sm:p-2 rounded-2xl overflow-hidden bg-orange-100 group-hover:ring-2 ring-orange-300/75 transition-all">
                                    <img src={categories.image} alt={categories.name} className="w-full h-full object-contain rounded-full transition-all" />
                                </div>
                                <span className="text-sm text-center">{categories.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HomeCategories
