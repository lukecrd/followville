export const SHOP_LICENSE=90,PARTY_FEE=40,PARTY_DURATION=15*60000,PARTY_CAPACITY=20;
export const SHOP_KINDS=[{id:'food',name:'Bottega del gusto',description:'Pizza, dolci e caffè per il quartiere.'},{id:'fashion',name:'Boutique',description:'Accessori e piccoli oggetti da collezionare.'},{id:'garage',name:'Officina',description:'Kit e accessori per gli amanti delle auto.'}] as const;
export const SHOP_BUILDINGS=['cafe','market','mall','office'];
export const SHOP_PRODUCTS=[
 {id:'coffee',kind:'food',name:'Caffè del quartiere',price:4,symbol:'☕'},{id:'pizza',kind:'food',name:'Pizza da passeggio',price:8,symbol:'🍕'},{id:'cake',kind:'food',name:'Dolce della casa',price:6,symbol:'🧁'},
 {id:'cap',kind:'fashion',name:'Cappellino della città',price:12,symbol:'🧢'},{id:'scarf',kind:'fashion',name:'Sciarpa colorata',price:14,symbol:'🧣'},{id:'bag',kind:'fashion',name:'Borsa dei vicini',price:18,symbol:'👜'},
 {id:'car-wash',kind:'garage',name:'Kit lavaggio auto',price:8,symbol:'🧽'},{id:'keyring',kind:'garage',name:'Portachiavi',price:10,symbol:'🔑'},{id:'car-sticker',kind:'garage',name:'Adesivo per l’auto',price:6,symbol:'⭐'},
] as const;
export const PARTY_THEMES=[{id:'picnic',name:'Picnic tra vicini',kinds:['garden','cafe']},{id:'music',name:'Festa in musica',kinds:['garden','stadium','amusement']},{id:'market',name:'Mercatino di quartiere',kinds:['market','mall','garden']}] as const;
export type ResidentShop={id:string;buildingId:string|null;owner:string;name:string;kind:string;color:string;products:string[];createdAt:number;closedAt:number|null;sales:number;revenue:number};
export type ShopOrder={id:string;shopId:string|null;buyer:string;seller:string;product:string;price:number;day:string;createdAt:number};
export type Friendship={id:string;first:string;second:string;requester:string;createdAt:number;acceptedAt:number|null};
export type TownParty={active?:boolean;live?:boolean;id:string;buildingId:string|null;host:string;title:string;theme:string;startsAt:number;endsAt:number;fee:number;createdAt:number;cancelledAt:number|null};
export type PartyAttendee={id:string;partyId:string|null;username:string;joinedAt:number;departureAt:number;fromX:number;fromY:number};
export type Gathering={buildingId:string;title:string;departureAt:number;endsAt:number;fromX:number;fromY:number};
export type SocialState={shops:ResidentShop[];orders:ShopOrder[];friendships:Friendship[];parties:TownParty[];attendees:PartyAttendee[]};
export const otherFriend=(f:Friendship,user:string)=>f.first===user?f.second:f.first;
