import type { Board } from "../../entities/board.entity";
import type { Repository } from "../../shared/database/repository";

export class BoardService {
  constructor(private readonly boardRepository: Repository<Board>) {}

  async createBoard(board: Board): Promise<Board> {
    return this.boardRepository.create(board);
  }

  async getBoardById(id: string): Promise<Board | null> {
    return this.boardRepository.findById(id);
  }

  async updateBoard(id: string, board: Board): Promise<Board> {
    return this.boardRepository.update(id, board);
  }
  
  async deleteBoard(id: string): Promise<void> {
    return this.boardRepository.delete(id);
  }

  async getBoards(): Promise<Board[]> {
    return this.boardRepository.query();
  }
  
  async getBoardCount(): Promise<number> {
    return this.boardRepository.count();
  }
}