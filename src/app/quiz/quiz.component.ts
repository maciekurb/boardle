import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, switchMap, catchError, startWith, map, filter } from 'rxjs/operators';
import { BoardGameService } from '../services/boardgame.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatProgressSpinnerModule
  ]
})
export class QuizComponent implements OnInit {
  guessControl = new FormControl();
  filteredGames: Observable<any[]> = of([]);
  boardGame: any;
  selectedGame: any;
  result: string = '';
  attributes: { [key: string]: string | boolean } = {};
  guesses: any[] = [];
  loading: boolean = false;  

  constructor(private boardGameService: BoardGameService) {
  }

  ngOnInit(): void {
    this.filteredGames = this.guessControl.valueChanges.pipe(
      startWith(''),
      debounceTime(750),
      switchMap(value => {
        if (value.length >= 2) {
          return this._filter(value);
        } else {
          return of([]);
        }
      })
    );

    this.loadBoardGame();

  }

  private _filter(value: string): Observable<any[]> {
    this.loading = true;  
    return this.boardGameService.searchBoardGames(value).pipe(
      map(games => {
        this.loading = false; 
        return this.filterGames(games);
      }),
      catchError(() => {
        this.loading = false;  
        return of([]);
      })
    );
  }

  private filterGames(games: any[]): any[] {
    return games.filter(game => {
      const gameId = game._attributes.id;
      const isInTop1000 = this.boardGameService.isGameInTop250(gameId);
      const isAlreadyGuessed = this.guesses.some(guess => guess.id === gameId);
      return isInTop1000 && !isAlreadyGuessed;
    });
  }
  

  loadBoardGame(): void {
    this.boardGameService.getRandomBoardGameId().then(randomId => {
      this.boardGameService.getBoardGame(randomId).then(data => {
        if (data) {
          this.boardGame = this.mapBoardGameData(data);
          // this.onOptionSelected(68448);
          // this.onOptionSelected(167355);
        }
      }).catch(error => {
        console.error('Error loading board game:', error);
      });
    }).catch(error => {
      console.error('Error getting random board game ID:', error);
    });
  }

  mapBoardGameData(data: any): any {
    const name = Array.isArray(data.name)
      ? data.name.find((n: any) => n._attributes && n._attributes.type === 'primary')?._attributes.value
      : data.name?._attributes?.value;
    const yearPublished = data.yearpublished?._attributes?.value;
    const categories = Array.isArray(data.link)
      ? data.link.filter((l: any) => l._attributes && l._attributes.type === 'boardgamecategory').map((c: any) => c._attributes.value).join(', ')
      : data.link?._attributes?.value;
    const mechanisms = Array.isArray(data.link)
      ? data.link.filter((l: any) => l._attributes && l._attributes.type === 'boardgamemechanic').map((m: any) => m._attributes.value).join(', ')
      : data.link?._attributes?.value;
    const thumbnail = data.thumbnail?._text;
    const minPlayers = data.minplayers?._attributes?.value;
    const maxPlayers = data.maxplayers?._attributes?.value;
    const playingTime = data.playingtime?._attributes?.value;
    const minAge = data.minage?._attributes?.value;
    const boardGameDesigner = Array.isArray(data.link)
      ? data.link.find((l: any) => l._attributes && l._attributes.type === 'boardgamedesigner')?._attributes.value
      : data.link?._attributes?.value;
    const averageWeight = data.statistics?.ratings?.averageweight?._attributes?.value;

    return {
      id: data._attributes.id,
      name,
      yearPublished,
      categories,
      mechanisms,
      thumbnail,
      minPlayers,
      maxPlayers,
      playingTime,
      minAge,
      boardGameDesigner,
      averageWeight
    };
  }


  async onOptionSelected(id: any): Promise<void> {
    const selectedGameId = id;
    this.loading = true;  

    try {
      const gameData = selectedGameId === this.selectedGame?.id
        ? this.selectedGame
        : await this.boardGameService.getBoardGame(selectedGameId);
      this.selectedGame = gameData;
      this.checkGuess();
      this.guessControl.reset();
      this.filteredGames = this.filteredGames.pipe(
        map(games => this.filterGames(games))
      );
      this.loading = false;  

    } catch (error) {
      console.error('Error fetching selected board game data:', error);
      this.loading = false; 

    }
  }

  getAttributeKeys(): string[] {
    return Object.keys(this.attributes);
  }

  checkGuess(): void {
    if (!this.boardGame || !this.selectedGame) {
      this.result = 'No game loaded or selected. Please try again.';
      return;
    }
  
    const { name, categories, mechanisms, yearPublished, minPlayers, maxPlayers, playingTime, minAge, boardGameDesigner, averageWeight } = this.boardGame;
    const guess = this.mapBoardGameData(this.selectedGame);
  
    let mechanismsRes = mechanisms.toLowerCase() === guess.mechanisms.toLowerCase() 
      ? 'correct' 
      : mechanisms.split(', ').some((m: string) => guess.mechanisms.toLowerCase().includes(m.toLowerCase())) 
        ? 'semi-correct' 
        : 'incorrect';
  
    let categoriesRes = categories.toLowerCase() === guess.categories.toLowerCase() 
      ? 'correct' 
      : categories.split(', ').some((c: string) => guess.categories.toLowerCase().includes(c.toLowerCase())) 
        ? 'semi-correct' 
        : 'incorrect';
  
    let playersRes = (minPlayers === guess.minPlayers && maxPlayers === guess.maxPlayers) 
      ? 'correct' 
      : (minPlayers === guess.minPlayers || maxPlayers === guess.maxPlayers) 
        ? 'semi-correct' 
        : 'incorrect';
  
    this.attributes = {
      name: guess.name,
      yearPublished: guess.yearPublished,
      categoriesRes: categoriesRes,
      category: guess.category,
      mechanisms: guess.mechanisms,
      mechanismsRes: mechanismsRes,
      players: guess.minPlayers + '-' + guess.maxPlayers,
      playersRes: playersRes,
      playingTime: guess.playingTime,
      minage: guess.minAge,
      boardGameDesigner: guess.boardGameDesigner,
      averageWeight: guess.averageWeight
    };
  
    this.result = guess.name === name ? 'Correct!' : 'Try again!';
    this.guesses.unshift({ ...guess, ...this.attributes });
  }
  
}
