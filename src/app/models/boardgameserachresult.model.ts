export interface BoardGameSearchResult {
    items: Items;
  }
  
  export interface Items {
    item: Item[];
  }
  
  export interface Item {
    _attributes: ItemAttributes;
    name: Name;
    yearpublished?: YearPublished;
  }
  
  export interface ItemAttributes {
    type: string;
    id: string;
  }
  
  export interface Name {
    _attributes: NameAttributes;
  }
  
  export interface NameAttributes {
    type: string;
    value: string;
  }
  
  export interface YearPublished {
    _attributes: YearPublishedAttributes;
  }
  
  export interface YearPublishedAttributes {
    value: string;
  }
  