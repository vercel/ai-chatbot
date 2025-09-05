import { nanoid } from 'nanoid';

/**
 * Represents a port on a card. Ports can be inputs or outputs
 * and have a data type used to validate connections.
 */
export interface Port {
  /** Identifier of the card that owns the port */
  cardId: string;
  /** Local identifier for the port */
  portId: string;
  /** Data type. Outputs may only be connected to inputs with matching type */
  dataType: string;
}

/**
 * A connection between an output port and an input port.
 */
export interface Link {
  /** Unique identifier for the link */
  id: string;
  from: Port;
  to: Port;
}

/**
 * Coordinates used for drawing links on the canvas.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Calculate an SVG path string for a link between two points.
 * The path is a simple cubic bezier curve which makes the link
 * visually pleasing when rendered inside an SVG element.
 */
export function calculateLinkPath(from: Point, to: Point): string {
  const deltaX = Math.abs(to.x - from.x) / 2;
  const control1 = { x: from.x + deltaX, y: from.y };
  const control2 = { x: to.x - deltaX, y: to.y };
  return `M${from.x},${from.y} C${control1.x},${control1.y} ${control2.x},${control2.y} ${to.x},${to.y}`;
}

/**
 * Manager responsible for creating, removing and navigating links
 * between cards. Besides storing the list of connections it also
 * keeps an undo/redo history which satisfies the "DoD" requirement
 * from the user story.
 */
export class LinkCardsManager {
  private links: Link[] = [];
  private undoStack: Link[][] = [];
  private redoStack: Link[][] = [];

  constructor(
    private draw: (link: Link) => void,
    private highlight: (cardIds: string[]) => void,
  ) {}

  /**
   * Validate that two ports can be connected. At the moment we only
   * allow connections when both ports have the same dataType. The
   * function returns `true` if the connection is valid and `false`
   * otherwise.
   */
  isCompatible(from: Port, to: Port): boolean {
    return from.dataType === to.dataType;
  }

  /**
   * Connect two cards. This performs a compatibility check, stores the
   * link, draws it and records the action in the undo stack. When the
   * connection is successful the new Link object is returned. If the
   * ports are incompatible an error is thrown.
   */
  connect(from: Port, to: Port): Link {
    if (!this.isCompatible(from, to)) {
      throw new Error('Incompatible ports');
    }
    const link: Link = { id: nanoid(), from, to };
    this.links.push(link);
    this.draw(link);
    this.pushHistory();
    this.highlightFlow();
    return link;
  }

  /**
   * Remove an existing connection.
   */
  disconnect(id: string): void {
    const index = this.links.findIndex((l) => l.id === id);
    if (index === -1) return;
    this.links.splice(index, 1);
    this.pushHistory();
    this.highlightFlow();
  }

  /**
   * Create an additional connection using the same output port. This
   * enables reusing a card's output as the input for another card.
   */
  reuseOutput(from: Port, newInput: Port): Link {
    return this.connect(from, newInput);
  }

  /** Undo the last linking action. */
  undo(): void {
    if (this.undoStack.length <= 1) return;
    const current = this.undoStack.pop();
    if (current) this.redoStack.push(current);
    this.links = [...this.undoStack[this.undoStack.length - 1]];
    this.highlightFlow();
  }

  /** Redo the previously undone action. */
  redo(): void {
    const state = this.redoStack.pop();
    if (!state) return;
    this.undoStack.push(state);
    this.links = [...state];
    this.highlightFlow();
  }

  /**
   * Highlight the flow starting from the given card id. If no card id is
   * provided every connected card will be highlighted. The highlight
   * callback receives the list of card ids to highlight.
   */
  highlightFlow(startId?: string): void {
    const visited = new Set<string>();
    const traverse = (id: string) => {
      for (const link of this.links) {
        if (link.from.cardId === id && !visited.has(link.to.cardId)) {
          visited.add(link.to.cardId);
          traverse(link.to.cardId);
        }
      }
    };

    if (startId) {
      visited.add(startId);
      traverse(startId);
    } else {
      for (const link of this.links) {
        visited.add(link.from.cardId);
        visited.add(link.to.cardId);
      }
    }

    this.highlight([...visited]);
  }

  /** Helper to push the current state of links to the undo stack. */
  private pushHistory(): void {
    this.undoStack.push([...this.links]);
    this.redoStack = [];
  }

  /** Expose the current links mainly for debugging or rendering. */
  getLinks(): Link[] {
    return [...this.links];
  }
}

export default LinkCardsManager;

