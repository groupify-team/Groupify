import {
    createUserProfile,
    getUserProfile,
    sendFriendRequest,
    acceptFriendRequest,
    getFriends
} from '../../services/firebase/users';

describe ('User services api tests', () => {
    const testUser1 = {
        uid: 'testUser1',
        email: 'user1@testUser1.com',
        displayName: 'Test User 1',
        gender: 'male'
    };
    const testUser2 = {
        uid: 'testUser2',
        email: 'user2@testUser2.com',
        displayName: 'Test User 2',
        gender: 'female'
    };
    beforeEach(() => {
        // setup test data
        jest.clearAllMocks();
    });
    test('should create user with valid data', async () => {
        const result = await createUserProfile(testUser1.uid, testUser1);
        expect(result).toBeDefined();
    });
    test('should retrieve existing user profile', async () => {
        await createUserProfile(testUser1.uid, testUser1);
        const profile = await getUserProfile(testUser1.uid);

        expect(profile).toMatchObject({
            email: testUser1.email,
            displayName: testUser1.displayName,
            gender: testUser1.gender
        });
    });
    test('should handle friend request workflow', async () =>{
        // Create two user profiles
        await createUserProfile(testUser1.uid, testUser1);
        await createUserProfile(testUser2.uid, testUser2);

        // User 1 sends friend request to User 2
        await sendFriendRequest(testUser1.uid, testUser2.uid);

        // User 2 accepts the friend request
        await acceptFriendRequest(testUser2.uid, testUser1.uid);

        //verify mutual friendship
        const user1Friends = await getFriends(testUser1.uid);
        const user2Friends = await getFriends(testUser2.uid);

        expect(user1Friends.some(f => f.uid === testUser2.uid)).toBe(true);
        expect(user2Friends.some(f => f.uid === testUser1.uid)).toBe(true);
    });

    test('should validate email format when creating user profile', async () => {
        const invalidUser = {
            ...testUser1,
            emial: 'invalid-email'
        };
        await expect(
            createUserProfile(invalidUser.uid, invalidUser)
        ).rejects.toThrow();
    });
});
