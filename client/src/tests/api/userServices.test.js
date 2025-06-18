import {
    createUserProfile,
    getUserProfile,
    sendFriendRequest,
    acceptFriendRequest,
    getFriends,
    findUsersByEmail
} from '../../services/firebase/users';

// Mock Firebase
jest.mock('../../services/firebase/config');
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),
    arrayUnion: jest.fn(),
    arrayRemove: jest.fn()
}));

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';

describe('User services API tests', () => {
    const testUser1 = {
        uid: 'testUser1',
        email: 'user1@testuser1.com', 
        displayName: 'Test User 1',
        gender: 'male'
    };

    const testUser2 = {
        uid: 'testUser2',
        email: 'user2@testuser2.com', 
        displayName: 'Test User 2',
        gender: 'female'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should create user with valid data', async () => {
        // Mock Firestore calls
        const mockDocRef = { id: 'mockDocId' };
        doc.mockReturnValue(mockDocRef);
        getDoc.mockResolvedValue({ exists: () => false });
        setDoc.mockResolvedValue();

        const result = await createUserProfile(testUser1.uid, testUser1);
        
        expect(result).toBeDefined();
        expect(setDoc).toHaveBeenCalledWith(
            mockDocRef,
            expect.objectContaining({
                uid: testUser1.uid,
                email: testUser1.email,
                displayName: testUser1.displayName,
                gender: testUser1.gender,
                friends: []
            })
        );
    });

    test('should retrieve existing user profile', async () => {
        // Mock existing user
        const mockUserData = {
            uid: testUser1.uid,
            email: testUser1.email,
            displayName: testUser1.displayName,
            gender: testUser1.gender,
            friends: []
        };

        doc.mockReturnValue({ id: 'mockDocId' });
        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => mockUserData
        });

        const profile = await getUserProfile(testUser1.uid);

        expect(profile).toMatchObject({
            email: testUser1.email,
            displayName: testUser1.displayName,
            gender: testUser1.gender
        });
    });

    test('should handle friend request workflow', async () => {
        // Mock document references
        const mockDocRef = { id: 'mockDocId' };
        doc.mockReturnValue(mockDocRef);
        
        // Mock user creation
        getDoc.mockResolvedValue({ exists: () => false });
        setDoc.mockResolvedValue();
        
        // Create users
        await createUserProfile(testUser1.uid, testUser1);
        await createUserProfile(testUser2.uid, testUser2);

        // Mock friend request operations
        updateDoc.mockResolvedValue();
        deleteDoc.mockResolvedValue();
        arrayUnion.mockImplementation((value) => ({ _type: 'arrayUnion', elements: [value] }));

        // Send and accept friend request
        await sendFriendRequest(testUser1.uid, testUser2.uid);
        await acceptFriendRequest(testUser2.uid, testUser1.uid);

        // Mock getFriends response
        getDoc
            .mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ friends: [testUser2.uid] })
            })
            .mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ 
                    uid: testUser2.uid,
                    displayName: testUser2.displayName,
                    email: testUser2.email
                })
            })
            .mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ friends: [testUser1.uid] })
            })
            .mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ 
                    uid: testUser1.uid,
                    displayName: testUser1.displayName,
                    email: testUser1.email
                })
            });

        // Verify mutual friendship
        const user1Friends = await getFriends(testUser1.uid);
        const user2Friends = await getFriends(testUser2.uid);

        expect(user1Friends.some(f => f.uid === testUser2.uid)).toBe(true);
        expect(user2Friends.some(f => f.uid === testUser1.uid)).toBe(true);
    });

    test('should find users by email', async () => {
        const mockUsers = [
            { id: 'user1', email: 'test@example.com', displayName: 'Test User' }
        ];

        collection.mockReturnValue('mockCollection');
        query.mockReturnValue('mockQuery');
        where.mockReturnValue('mockWhere');
        getDocs.mockResolvedValue({
            forEach: (callback) => {
                mockUsers.forEach((user) => {
                    callback({ id: user.id, data: () => user });
                });
            }
        });

        const users = await findUsersByEmail('test@example.com');
        
        expect(users).toHaveLength(1);
        expect(users[0].email).toBe('test@example.com');
    });

    test('should handle invalid email format', async () => {
        // Mock an invalid user with an incorrect email format
        const invalidUser = {
            ...testUser1,
            email: 'invalid-email' // Invalid email format
        };

        // Mock validation failure or empty result
        collection.mockReturnValue('mockCollection');
        query.mockReturnValue('mockQuery');
        where.mockReturnValue('mockWhere');
        getDocs.mockResolvedValue({
            forEach: () => {} // Empty result
        });

        const users = await findUsersByEmail(invalidUser.email);
        expect(users).toHaveLength(0);
    });
});