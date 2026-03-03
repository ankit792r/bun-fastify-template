import type { Collection } from "mongodb";
import type { Board } from "../../collections/board.model";

export class BoardService {
  constructor(private readonly boardCollection: Collection<Board>) { }

  async listBoards(): Promise<Board[]> {
    const cursor = this.boardCollection.find({});
    return cursor.toArray();
  }
  async createBoard(board: Board): Promise<Board> {
    await this.boardCollection.insertOne(board);
    return board;
  }

  async getBoardById(_id: string): Promise<Board | null> {
    return this.boardCollection.findOne({ _id });
  }

  async updateBoard(_id: string, board: Board): Promise<string> {
    await this.boardCollection.updateOne({ _id }, board);
    return _id;
  }

  async deleteBoard(_id: string): Promise<void> {
    this.boardCollection.deleteOne({ _id });
  }

  async getBoardCount(): Promise<number> {
    return this.boardCollection.countDocuments();
  }
}
