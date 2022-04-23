// contract/assembly/model.ts

import { env, PersistentVector, PersistentMap, math } from "near-sdk-as";


//data structure of option
@nearBindgen
export class option {
  id: u32;
  name: string;
  vote: u32;

  constructor(name: string) {
    this.id = math.hash32<string>(this.name);
    this.name = this.name;
  }
}
//data structure of a voting
@nearBindgen
export class Voting {
    id: i32;
    owner: string;                          
    content: string;                        
    status: i32;                            // 0: New - 1: Running - 2: Close
    startTime: u64;
    startBlock: u64;
    endTime: u64;
    endBlock: u64;
   options: option[];
    Option: any;
    increaseVote: any;

    // Contructor function
    constructor(_id: i32, _owner: string, _content: string) {
        this.id = _id;
        this.owner = _owner;
        this.content = _content;
        this.status = 0;
        this.startTime = 0;
        this.startBlock = 0;
        this.endTime = 0;
        this.endBlock = 0;
        this.options = [];
    }

    // Allow to start voting
    startVote(): void {
        this.status = 1;
        this.startTime = env.block_timestamp();
        this.startBlock = env.block_index();
    }

    // Close voting
    endVote(): void {
        this.status = 2;
        this.endTime = env.block_timestamp();
        this.endBlock = env.block_index();
    }

    // Add an option to the voting
    export function addoption ({ option }: { option: string; }): void {
        
    }


    // Increase vote for an option
   export function increaseVote(this: any, { optionId }: { optionId: i32; }): void {
        this.options[optionId].vote++;
    }


// Store the information of votings to the blockchain
export const votingInfos = new PersistentVector<Voting>("voting_infos");

// Store the information 
export const votingUsers = new PersistentMap<i32, PersistentMap<string, string>>("voting_users");