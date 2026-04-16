/**
 * Nodo de la Lista Doblemente Enlazada
 * Double Linked List Node
 */
export class DLLNode<T> {
  data: T;
  prev: DLLNode<T> | null = null;
  next: DLLNode<T> | null = null;

  constructor(data: T) {
    this.data = data;
  }
}

/**
 * Lista Doblemente Enlazada (Doubly Linked List)
 * Usada como estructura principal para la lista de reproducción
 */
export class DoublyLinkedList<T> {
  head: DLLNode<T> | null = null;
  tail: DLLNode<T> | null = null;
  private _size: number = 0;

  get size(): number {
    return this._size;
  }

  get isEmpty(): boolean {
    return this._size === 0;
  }

  /** Agregar al inicio */
  addFirst(data: T): void {
    const newNode = new DLLNode(data);
    if (this.isEmpty) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.next = this.head;
      this.head!.prev = newNode;
      this.head = newNode;
    }
    this._size++;
  }

  /** Agregar al final */
  addLast(data: T): void {
    const newNode = new DLLNode(data);
    if (this.isEmpty) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.prev = this.tail;
      this.tail!.next = newNode;
      this.tail = newNode;
    }
    this._size++;
  }

  /** Agregar en posición específica (0-indexed) */
  addAt(index: number, data: T): void {
    if (index < 0 || index > this._size) {
      throw new Error(`Índice ${index} fuera de rango (0 - ${this._size})`);
    }
    if (index === 0) return this.addFirst(data);
    if (index === this._size) return this.addLast(data);

    const newNode = new DLLNode(data);
    let current = this.head!;
    for (let i = 0; i < index - 1; i++) {
      current = current.next!;
    }
    newNode.next = current.next;
    newNode.prev = current;
    current.next!.prev = newNode;
    current.next = newNode;
    this._size++;
  }

  /** Eliminar primer nodo */
  removeFirst(): T | null {
    if (this.isEmpty) return null;
    const data = this.head!.data;
    if (this._size === 1) {
      this.head = null;
      this.tail = null;
    } else {
      this.head = this.head!.next;
      this.head!.prev = null;
    }
    this._size--;
    return data;
  }

  /** Eliminar último nodo */
  removeLast(): T | null {
    if (this.isEmpty) return null;
    const data = this.tail!.data;
    if (this._size === 1) {
      this.head = null;
      this.tail = null;
    } else {
      this.tail = this.tail!.prev;
      this.tail!.next = null;
    }
    this._size--;
    return data;
  }

  /** Eliminar en posición específica */
  removeAt(index: number): T | null {
    if (index < 0 || index >= this._size) return null;
    if (index === 0) return this.removeFirst();
    if (index === this._size - 1) return this.removeLast();

    let current = this.head!;
    for (let i = 0; i < index; i++) {
      current = current.next!;
    }
    current.prev!.next = current.next;
    current.next!.prev = current.prev;
    this._size--;
    return current.data;
  }

  /** Eliminar por predicado */
  removeWhere(predicate: (data: T) => boolean): boolean {
    let current = this.head;
    let index = 0;
    while (current) {
      if (predicate(current.data)) {
        this.removeAt(index);
        return true;
      }
      current = current.next;
      index++;
    }
    return false;
  }

  /** Obtener elemento en posición */
  get(index: number): T | null {
    if (index < 0 || index >= this._size) return null;
    let current = this.head!;
    for (let i = 0; i < index; i++) {
      current = current.next!;
    }
    return current.data;
  }

  /** Encontrar índice de un elemento */
  indexOf(predicate: (data: T) => boolean): number {
    let current = this.head;
    let index = 0;
    while (current) {
      if (predicate(current.data)) return index;
      current = current.next;
      index++;
    }
    return -1;
  }

  /** Convertir a array */
  toArray(): T[] {
    const arr: T[] = [];
    let current = this.head;
    while (current) {
      arr.push(current.data);
      current = current.next;
    }
    return arr;
  }

  /** Crear desde array */
  static fromArray<T>(arr: T[]): DoublyLinkedList<T> {
    const list = new DoublyLinkedList<T>();
    arr.forEach(item => list.addLast(item));
    return list;
  }

  /** Limpiar lista */
  clear(): void {
    this.head = null;
    this.tail = null;
    this._size = 0;
  }

  /** Adelantar: mover canción hacia adelante en la lista */
  moveForward(index: number): boolean {
    if (index <= 0 || index >= this._size) return false;
    const data = this.removeAt(index);
    if (data === null) return false;
    this.addAt(index - 1, data);
    return true;
  }

  /** Retroceder: mover canción hacia atrás en la lista */
  moveBackward(index: number): boolean {
    if (index < 0 || index >= this._size - 1) return false;
    const data = this.removeAt(index);
    if (data === null) return false;
    this.addAt(index + 1, data);
    return true;
  }

  /** Shuffle (mezclar aleatoriamente) */
  shuffle(): void {
    const arr = this.toArray();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    this.clear();
    arr.forEach(item => this.addLast(item));
  }
}