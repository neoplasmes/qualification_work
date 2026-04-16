class LinkedListNode<T> {
    constructor(
        public value: T,
        public next: LinkedListNode<T> | null = null
    ) {}
}

export class Queue<T> {
    constructor(
        private head: LinkedListNode<T> | null = null,
        private tail: LinkedListNode<T> | null = null,
        private _size: number = 0
    ) {}

    get size(): number {
        return this._size;
    }

    isEmpty(): boolean {
        return this._size === 0;
    }

    peekHead(): T | null {
        return this.head?.value ?? null;
    }

    peekTail(): T | null {
        return this.tail?.value ?? null;
    }

    enqueue(value: T): void {
        const newNode = new LinkedListNode(value);

        if (this.isEmpty()) {
            this.head = newNode;
            this.tail = newNode;
        } else {
            this.tail!.next = newNode;
            this.tail = newNode;
        }

        this._size++;
    }

    dequeue(): T | null {
        if (this.isEmpty()) {
            return null;
        }

        const value = this.head!.value;
        this.head = this.head!.next;
        this._size--;

        if (this.isEmpty()) {
            this.tail = null;
        }

        return value;
    }
}
