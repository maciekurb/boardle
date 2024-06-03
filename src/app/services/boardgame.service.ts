import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as convert from 'xml-js';
import { BoardGameSearchResult, Item } from '../models/boardgameserachresult.model';

@Injectable({
  providedIn: 'root'
})
export class BoardGameService {
  private apiUrl = 'https://api.geekdo.com/xmlapi2';
  private readonly gameIds: string[] = [];
  private loadGameIdsPromise: Promise<void>;

  constructor(private http: HttpClient) {
    this.loadGameIdsPromise = this.loadGameIds();
  }

  private loadGameIds(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<{ ids: string[] }>('/assets/game-ids.json').subscribe(
        data => {
          this.gameIds.push(...data.ids.map(id => id.replace(/^0+/, '')));
          resolve();
        },
        error => {
          console.error('Error loading game IDs:', error);
          reject(error);
        }
      );
    });
  }

  private async ensureGameIdsLoaded(): Promise<void> {
    await this.loadGameIdsPromise;
  }

  async getRandomBoardGameId(): Promise<string> {
    await this.ensureGameIdsLoaded();
    const randomIndex = Math.floor(Math.random() * this.gameIds.length);
    return this.gameIds[randomIndex];
    //return '68448';
  }

  async getBoardGame(id: string): Promise<any> {
    await this.ensureGameIdsLoaded();
    return this.http.get(`${this.apiUrl}/thing?id=${id}&stats=1`, { responseType: 'text' }).pipe(
      map(response => {
        const result = convert.xml2js(response, { compact: true, ignoreComment: true }) as any;
        return result?.items?.item || null;
      }),
      catchError(error => {
        console.error('Error fetching board game data:', error);
        return of(null);
      })
    ).toPromise();
  }

  searchBoardGames(query: string): Observable<any[]> {
    return this.http.get(`${this.apiUrl}/search?query=${query}&type=boardgame`, { responseType: 'text' }).pipe(
      map(response => {
        const result = convert.xml2js(response, { compact: true, ignoreComment: true }) as any;
        return result?.items?.item || [];
      }),
      catchError(error => {
        console.error('Error searching board games:', error);
        return of([]);
      })
    );
  }

  isGameInTop250(gameId: string): boolean {
    return this.gameIds.includes(gameId);
  }
}
