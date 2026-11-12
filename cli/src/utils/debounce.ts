type Debounced<T extends (...args: never[]) => void> = ((...args: Parameters<T>) => void) & {
    cancel: () => void;
};

export const debounce = <T extends (...args: never[]) => void>(
    callback: T,
    delay: number,
): Debounced<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const debounced = ((...args: Parameters<T>) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = undefined;
            callback(...args);
        }, delay);
    }) as Debounced<T>;

    debounced.cancel = () => {
        if (timer) clearTimeout(timer);
        timer = undefined;
    };

    return debounced;
};
