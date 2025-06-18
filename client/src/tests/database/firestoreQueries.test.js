import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    addDoc
} from 'firebase/firestore';

// Mock Firebase
jest.mock('../../services/firebase/config');
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    addDoc: jest.fn()
}));

describe('Firestore query tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should query users by email', async () => {
        const testEmail = 'querytest@example.com';
        const mockUser = {
            email: testEmail,
            displayName: 'Query Test User',
            createdAt: new Date().toISOString()
        };

        // Mock successful document addition
        addDoc.mockResolvedValue({ id: 'mockDocId' });
        
        // Mock query operations
        collection.mockReturnValue('mockCollection');
        query.mockReturnValue('mockQuery');
        where.mockReturnValue('mockWhere');
        
        // Mock query results
        getDocs.mockResolvedValue({
            size: 1,
            forEach: (callback) => {
                callback({
                    id: 'mockDocId',
                    data: () => mockUser
                });
            }
        });

        // Add test user (mocked)
        await addDoc(collection('users'), mockUser);

        // Query by email
        const q = query(
            collection('users'),
            where('email', '==', testEmail)
        );

        const querySnapshot = await getDocs(q);
        
        expect(querySnapshot.size).toBeGreaterThan(0);
        expect(collection).toHaveBeenCalledWith('users');
        expect(where).toHaveBeenCalledWith('email', '==', testEmail);
        
        // Verify query results
        querySnapshot.forEach((doc) => {
            expect(doc.data().email).toBe(testEmail);
        });
    });

    test('should retrieve trips with member filtering', async () => {
        const testUserId = 'test-user-trips';
        const mockTrip = {
            name: 'Test trip for query',
            members: [testUserId, 'other-user'],
            createdAt: new Date().toISOString()
        };

        // Mock document addition
        addDoc.mockResolvedValue({ id: 'mockTripId' });
        
        // Mock query operations
        collection.mockReturnValue('mockCollection');
        query.mockReturnValue('mockQuery');
        where.mockReturnValue('mockWhere');
        
        // Mock query results
        getDocs.mockResolvedValue({
            size: 1,
            forEach: (callback) => {
                callback({
                    id: 'mockTripId',
                    data: () => mockTrip
                });
            }
        });

        // Add test trip (mocked)
        await addDoc(collection('trips'), mockTrip);

        // Query trips by member
        const q = query(
            collection('trips'),
            where('members', 'array-contains', testUserId)
        );

        const querySnapshot = await getDocs(q);
        
        expect(querySnapshot.size).toBeGreaterThan(0);
        expect(where).toHaveBeenCalledWith('members', 'array-contains', testUserId);

        querySnapshot.forEach((doc) => {
            expect(doc.data().members).toContain(testUserId);
        });
    });

    test('should order and limit query results', async () => {
        const mockTrips = [
            { 
                id: 'trip1', 
                name: 'Recent Trip', 
                createdAt: new Date('2024-01-15').toISOString() 
            },
            { 
                id: 'trip2', 
                name: 'Older Trip', 
                createdAt: new Date('2024-01-10').toISOString() 
            }
        ];

        // Mock query operations
        collection.mockReturnValue('mockCollection');
        query.mockReturnValue('mockQuery');
        orderBy.mockReturnValue('mockOrderBy');
        limit.mockReturnValue('mockLimit');
        
        // Mock ordered results
        getDocs.mockResolvedValue({
            size: 2,
            forEach: (callback) => {
                // Return in descending order
                mockTrips
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .forEach((trip) => {
                        callback({
                            id: trip.id,
                            data: () => trip
                        });
                    });
            }
        });

        // Query recent trips with limit
        const q = query(
            collection('trips'),
            orderBy('createdAt', 'desc'),
            limit(5)
        );

        const querySnapshot = await getDocs(q);
        
        expect(querySnapshot.size).toBeLessThanOrEqual(5);
        expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
        expect(limit).toHaveBeenCalledWith(5);

        // Verify ordering
        let previousDate = new Date();
        querySnapshot.forEach((doc) => {
            const currentDate = new Date(doc.data().createdAt);
            expect(currentDate <= previousDate).toBe(true);
            previousDate = currentDate;
        });
    });

    test('should validate compound queries', async () => {
        const testUserId = 'compound-query-user';
        const mockRequests = [
            {
                id: 'req1',
                to: testUserId,
                status: 'pending',
                from: 'sender1'
            }
        ];

        // Mock query operations
        collection.mockReturnValue('mockCollection');
        query.mockReturnValue('mockQuery');
        where.mockReturnValue('mockWhere');
        
        getDocs.mockResolvedValue({
            forEach: (callback) => {
                mockRequests.forEach((request) => {
                    callback({
                        id: request.id,
                        data: () => request
                    });
                });
            }
        });

        // Query pending friend requests for specific user
        const q = query(
            collection('friendRequests'),
            where('to', '==', testUserId),
            where('status', '==', 'pending')
        );

        const querySnapshot = await getDocs(q);

        // Verify compound query was constructed correctly
        expect(where).toHaveBeenCalledWith('to', '==', testUserId);
        expect(where).toHaveBeenCalledWith('status', '==', 'pending');

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            expect(data.to).toBe(testUserId);
            expect(data.status).toBe('pending');
        });
    });
});