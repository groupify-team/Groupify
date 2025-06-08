import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    addDoc
} from 'firebase/firestore';
import { db } from '../../services/firebase/config';

describe('Firestore query tests', () => {

    test('should query users by email', async () => {
        const testEmail = 'querytest@example.com';

        // add test user
        await addDoc(collection(db, 'users'), {
            email: testEmail,
            displayName: 'Query Test User',
            createdAt: new Date().toISOString()
        });

        // query by email
        const q = query(
            collection(db, 'users'),
            where('email', '==', testEmail)
        );

        const querySnapshot = await getDocs(q);
        expect(querySnapshot.size).toBeGreaterThan(0);

        querySnapshot.forEach((doc) => {
            expect(doc.data().email).toBe(testEmail);
        });
    });

    test('should retrieve trips with member filtering', async () => {
        const testUserId = 'test-user-trips';

        // add test trip
        await addDoc(collection(db, 'trips'), {
            name: 'test trip for query',
            members: [testUserId, 'other-user'],
            createdAt: new Date().toISOString()
        });

        // query trips by member
        const q = query(
            collection(db, 'trips'),
            where('members', 'array-contains', testUserId)
        );

        const querySnapshot = await getDocs(q);
        expect(querySnapshot.size).toBeGreaterThan(0);

        querySnapshot.forEach((doc) => {
            expect(doc.data().members).toContain(testUserId);
        });
    });

    test('should order and limit query results', async () => {
        // query recent trips with limit
        const q = query(
            collection(db, 'trips'),
            orderBy('createdAt', 'desc'),
            limit(5)
        );

        const querySnapshot = await getDocs(q);
        expect(querySnapshot.size).toBeLessThanOrEqual(5);

        // verify ordering
        let previousDate = new Date();
        querySnapshot.forEach((doc) => {
            const currentDate = new Date(doc.data().createdAt);
            expect(currentDate <= previousDate).toBe(true);
            previousDate = currentDate;
        });
    });

    test('should validate compound queries', async () => {
        const testUserId = 'compound-query-user';

        // query pending friend requests for specific user
        const q = query(
            collection(db, 'friendRequests'),
            where('to', '==', testUserId),
            where('status', '==', 'pending')
        );

        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            expect(data.to).toBe(testUserId);
            expect(data.status).toBe('pending');
        });
    });

});
