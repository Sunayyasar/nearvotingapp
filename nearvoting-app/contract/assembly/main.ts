import { Context, PersistentMap, logging, u128, env } from 'near-sdk-as'
import { option, Voting, votingInfos, votingUsers } from './model';

// Users who want to vote need to deposit at least 0.1 NEAR
// This will help prevent users from spamming
const MIN_VOTE_AMOUNT = u128.from("100000000000000000000000");

// Get current voting
function _getVotingInfo(): Voting | null {
    let len = votingInfos.length;
    if (len>0) return votingInfos[len-1];
    return null;
}

// Allows users to create new voting
// Don't check user permissions so anyone can create
// It's convenient that other people can run the contract as well.
// But for real implementation, you have to check the permissions, only the owner has the right to create votes
export function createVoting(content: string): bool {
    // Checking
    assert(content, "You must enter the content!");
    let currVote = _getVotingInfo();
    if (currVote) {
        assert(currVote.status==2, "The vote is not ended. You can not create new voting!");
    }
    
    // Create new vote and store into blockchain
    // The id of the vote is its position in the array
    let id = votingInfos.length;
    let item = new Voting(id, Context.sender, content);
    item.startVote();                                       // Reduce action for users
    votingInfos.push(item);

    // Create votingUser and store it into blockchain
    let votingUser = new PersistentMap<string, string>(`voting_users_${id}`);
    votingUsers.set(id, votingUser);

    return true;
}

// Allows users to add option to the current voting
export function addoption(option: string): bool {
    // Checking
    let currVote = _getVotingInfo();
    assert(currVote!=null, "There is no voting!");
    assert(option!="", "Invalid input");
    
    if (currVote) {
        assert(currVote.status==0 || currVote.status==1, "The vote is ended. You can not add option!");
        currVote.Option(option);
        votingInfos.replace(votingInfos.length-1, currVote);

        return true;
    }

    return false;
}

// Allow to start voting
export function startVote(): bool {
    // Checking
    let currVote = _getVotingInfo();
    assert(currVote!=null, "There is no voting!");
    if (currVote) {
        // Checking more
        assert(currVote.status==0, "The vote is running or ended. You can not start voting!");
        // assert(currVote.owner==Context.sender, "You is not owner of current vote!");
        
        // Update current voting and store it into blockchain
        currVote.startVote();
        votingInfos.replace(votingInfos.length-1, currVote);
    }
    return true;
}

// Close voting
export function endVote(): bool {
    let currVote = _getVotingInfo();
    assert(currVote!=null, "There is no voting!");
    if (currVote) {
        assert(currVote.status==1, "The vote is not running. You can not end voting!");
        currVote.endVote();
        votingInfos.replace(votingInfos.length-1, currVote);
    }
    return true;
}

// Users vote for their favorite option
export function vote(optionId: i32): bool {
    let currVote = _getVotingInfo();
    assert(currVote!=null, "There is no voting!");
    if (currVote) {
        assert(currVote.status==1, "The vote is not running. You can not vote!");
        assert(optionId>=0 && optionId<currVote.options.length, "The optionId is invalid!");

         // Check deposit
        let attachedDeposit = Context.attachedDeposit;
        assert(u128.ge(attachedDeposit, MIN_VOTE_AMOUNT), "You must deposit 0.5 NEAR to vote!");

        // Checking account
        let votingUser = votingUsers.get(currVote.id);
        assert(votingUser!=null, "Invalid data!");

        if (votingUser) {
            assert(votingUser.get(Context.sender)==null, "You had voted before!");

            votingUser.set(Context.sender, `${optionId}`);
            votingUsers.set(currVote.id, votingUser);
            currVote.increaseVote(optionId);
            votingInfos.replace(votingInfos.length-1, currVote);

            return true;
        }
    }
    return false;
}

// Get information of current voting / lastest voting
export function votingInfo(): Voting | null {
    return _getVotingInfo();
}

