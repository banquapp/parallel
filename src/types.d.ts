declare interface TQueue<TInput, TOutput> {
	(input: AsyncIterableIterator<TInput> | IterableIterator<TInput>, concurrentTasksLimit: number, action: (input: TInput, index: number) => TOutput): AsyncIterableIterator<TOutput>;
}

