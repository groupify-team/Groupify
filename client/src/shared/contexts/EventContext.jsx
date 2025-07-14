import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useAuth } from "@auth/hooks/useAuth";
import { UserService } from "@shared/services/user/UserService";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  updateDoc,
  getDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@shared/services/firebase/config";
import { eventsService } from "@dashboard/features/events/services/eventsService";
import { updateEvent, addEventMember } from "@shared/services/firebase/events";

// Actions
const EVENT_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_EVENTS: "SET_EVENTS",
  SET_EVENT_MEMBERS: "SET_EVENT_MEMBERS",
  SET_EVENT_INVITATIONS: "SET_EVENT_INVITATIONS",
  UPDATE_EVENT: "UPDATE_EVENT",
  ADD_EVENT: "ADD_EVENT",
  REMOVE_EVENT: "REMOVE_EVENT",
  UPDATE_EVENT_MEMBERS: "UPDATE_EVENT_MEMBERS",
  ADD_EVENT_MEMBER: "ADD_EVENT_MEMBER",
  REMOVE_EVENT_MEMBER: "REMOVE_EVENT_MEMBER",
  UPDATE_EVENT_ADMINS: "UPDATE_EVENT_ADMINS",
  SET_ERROR: "SET_ERROR",
};

const initialState = {
  events: [],
  eventMembers: {},
  eventInvitations: [],
  eventInvitationIds: [],
  sentEventInvitations: [],
  loading: true,
  error: null,
};

function eventReducer(state, action) {
  switch (action.type) {
    case EVENT_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case EVENT_ACTIONS.SET_EVENTS:
      return { ...state, events: action.payload };

    case EVENT_ACTIONS.SET_EVENT_MEMBERS:
      return {
        ...state,
        eventMembers: {
          ...state.eventMembers,
          [action.payload.eventId]: action.payload.members,
        },
      };

    case EVENT_ACTIONS.SET_EVENT_INVITATIONS:
      return {
        ...state,
        eventInvitations: action.payload,
        eventInvitationIds: action.payload.map((inv) => inv.eventId),
      };

    case EVENT_ACTIONS.UPDATE_EVENT:
      return {
        ...state,
        events: state.events.map((event) =>
          event.id === action.payload.id
            ? { ...event, ...action.payload }
            : event
        ),
      };

    case EVENT_ACTIONS.ADD_EVENT:
      return {
        ...state,
        events: [...state.events, action.payload],
      };

    case EVENT_ACTIONS.REMOVE_EVENT:
      const eventIdToRemove = action.payload;
      const { [eventIdToRemove]: removedMembers, ...remainingMembers } =
        state.eventMembers;
      return {
        ...state,
        events: state.events.filter((event) => event.id !== eventIdToRemove),
        eventMembers: remainingMembers,
      };

    case EVENT_ACTIONS.UPDATE_EVENT_MEMBERS:
      return {
        ...state,
        eventMembers: {
          ...state.eventMembers,
          [action.payload.eventId]: action.payload.members,
        },
        events: state.events.map((event) =>
          event.id === action.payload.eventId
            ? { ...event, members: action.payload.members.map((m) => m.uid) }
            : event
        ),
      };

    case EVENT_ACTIONS.ADD_EVENT_MEMBER:
      const { eventId: addEventId, member: newMember } = action.payload;
      const currentMembers = state.eventMembers[addEventId] || [];

      // Don't add if already exists
      if (currentMembers.some((m) => m.uid === newMember.uid)) {
        return state;
      }

      const updatedMembers = [...currentMembers, newMember];
      return {
        ...state,
        eventMembers: {
          ...state.eventMembers,
          [addEventId]: updatedMembers,
        },
        events: state.events.map((event) =>
          event.id === addEventId
            ? { ...event, members: [...(event.members || []), newMember.uid] }
            : event
        ),
      };

    case EVENT_ACTIONS.REMOVE_EVENT_MEMBER:
      const { eventId: removeEventId, memberId } = action.payload;
      const membersAfterRemoval = (
        state.eventMembers[removeEventId] || []
      ).filter((m) => m.uid !== memberId);

      return {
        ...state,
        eventMembers: {
          ...state.eventMembers,
          [removeEventId]: membersAfterRemoval,
        },
        events: state.events.map((event) =>
          event.id === removeEventId
            ? {
                ...event,
                members: (event.members || []).filter(
                  (uid) => uid !== memberId
                ),
                admins: (event.admins || []).filter((uid) => uid !== memberId),
              }
            : event
        ),
      };

    case EVENT_ACTIONS.UPDATE_EVENT_ADMINS:
      return {
        ...state,
        events: state.events.map((event) =>
          event.id === action.payload.eventId
            ? { ...event, admins: action.payload.admins }
            : event
        ),
      };

    case EVENT_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };

    default:
      return state;
  }
}

const EventContext = createContext();
export const EventProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [state, dispatch] = useReducer(eventReducer, initialState);
  const acceptEventInvitation = async (invitationId, eventId) => {
    try {
      await updateDoc(doc(db, "events", eventId), {
        members: arrayUnion(currentUser.uid),
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, "eventInvites", invitationId), {
        status: "accepted",
        acceptedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error("❌ ERROR: Failed to accept invitation:", error);
      console.error("❌ ERROR details:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      throw error;
    }
  };

  const rejectEventInvitation = async (invitationId) => {
    try {
      await updateDoc(doc(db, "eventInvites", invitationId), {
        status: "rejected",
        rejectedAt: new Date().toISOString(),
      });

      dispatch({
        type: EVENT_ACTIONS.SET_EVENT_INVITATIONS,
        payload: state.eventInvitations.filter(
          (inv) => inv.id !== invitationId
        ),
      });

      return true;
    } catch (error) {
      console.error(
        "❌ EventContext: Error rejecting event invitation:",
        error
      );
      throw error;
    }
  };

  const promoteToAdmin = async (eventId, userId) => {
    try {
      const event = state.events.find((e) => e.id === eventId);
      if (!event) throw new Error("Event not found");
      const updatedAdmins = [...(event.admins || []), userId];
      await updateEvent(eventId, { admins: updatedAdmins });
      dispatch({
        type: EVENT_ACTIONS.UPDATE_EVENT_ADMINS,
        payload: { eventId, admins: updatedAdmins },
      });
      return true;
    } catch (error) {
      console.error("❌ EventContext: Error promoting user to admin:", error);
      throw error;
    }
  };

  const demoteFromAdmin = async (eventId, userId) => {
    try {
      const event = state.events.find((e) => e.id === eventId);
      if (!event) throw new Error("Event not found");
      const updatedAdmins = (event.admins || []).filter(
        (uid) => uid !== userId
      );
      await updateEvent(eventId, { admins: updatedAdmins });
      dispatch({
        type: EVENT_ACTIONS.UPDATE_EVENT_ADMINS,
        payload: { eventId, admins: updatedAdmins },
      });
      return true;
    } catch (error) {
      console.error("❌ EventContext: Error demoting user from admin:", error);
      throw error;
    }
  };

  const removeEventMember = async (eventId, userId) => {
    try {
      const event = state.events.find((e) => e.id === eventId);
      if (!event) throw new Error("Event not found");
      const updatedMembers = (event.members || []).filter(
        (uid) => uid !== userId
      );
      const updatedAdmins = (event.admins || []).filter(
        (uid) => uid !== userId
      );
      await updateEvent(eventId, {
        members: updatedMembers,
        admins: updatedAdmins,
      });

      dispatch({
        type: EVENT_ACTIONS.REMOVE_EVENT_MEMBER,
        payload: { eventId, memberId: userId },
      });

      return true;
    } catch (error) {
      console.error("❌ EventContext: Error removing event member:", error);
      throw error;
    }
  };

  const leaveEvent = async (eventId) => {
    return removeEventMember(eventId, currentUser.uid);
  };

  const getEventById = (eventId) => {
    return state.events.find((event) => event.id === eventId);
  };

  const getEventMembers = (eventId) => {
    return state.eventMembers[eventId] || [];
  };

  const isEventAdmin = (eventId, userId = currentUser?.uid) => {
    const event = getEventById(eventId);
    return event?.admins?.includes(userId) || false;
  };

  const isEventCreator = (eventId, userId = currentUser?.uid) => {
    const event = getEventById(eventId);
    return event?.createdBy === userId;
  };

  const isEventMember = (eventId, userId = currentUser?.uid) => {
    const event = getEventById(eventId);
    return event?.members?.includes(userId) || false;
  };

  const getUserEventRole = (eventId, userId = currentUser?.uid) => {
    if (isEventCreator(eventId, userId)) return "creator";
    if (isEventAdmin(eventId, userId)) return "admin";
    if (isEventMember(eventId, userId)) return "member";
    return "none";
  };

  useEffect(() => {
    if (!currentUser?.uid) {
      dispatch({ type: EVENT_ACTIONS.SET_LOADING, payload: false });
      return;
    }

    let eventListeners = new Map();
    let unsubscribeEventInvitations;
    let unsubscribeUserEvents;

    const setupEventListeners = async () => {
      try {
        dispatch({ type: EVENT_ACTIONS.SET_LOADING, payload: true });
        const userEvents = await eventsService.getEvents(currentUser.uid);
        dispatch({ type: EVENT_ACTIONS.SET_EVENTS, payload: userEvents });
        userEvents.forEach((event) => {
          setupSingleEventListener(event.id);
        });

        const invitationsQuery = query(
          collection(db, "eventInvites"),
          where("inviteeUid", "==", currentUser.uid),
          where("status", "==", "pending")
        );

        unsubscribeEventInvitations = onSnapshot(
          invitationsQuery,
          async (snapshot) => {
            const invitations = [];

            for (const docSnap of snapshot.docs) {
              const data = docSnap.data();
              try {
                const eventDoc = await getDoc(doc(db, "events", data.eventId));
                if (eventDoc.exists()) {
                  const eventData = eventDoc.data();

                  const senderProfile = await UserService.getUserProfile(
                    data.inviterUid
                  );

                  invitations.push({
                    id: docSnap.id,
                    ...data,
                    eventTitle: eventData.title || eventData.name,
                    eventDescription: eventData.description,
                    senderName: senderProfile?.displayName || "Unknown User",
                    senderEmail: senderProfile?.email,
                    senderPhotoURL: senderProfile?.photoURL,
                  });
                }
              } catch (error) {
                console.warn(
                  `Failed to fetch invitation details ${docSnap.id}:`,
                  error
                );
              }
            }
            dispatch({
              type: EVENT_ACTIONS.SET_EVENT_INVITATIONS,
              payload: invitations,
            });
          }
        );

        const userEventsQuery = query(
          collection(db, "events"),
          where("members", "array-contains", currentUser.uid)
        );

        unsubscribeUserEvents = onSnapshot(userEventsQuery, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const eventData = { id: change.doc.id, ...change.doc.data() };

            if (change.type === "added") {
              if (!eventListeners.has(change.doc.id)) {
                dispatch({ type: EVENT_ACTIONS.ADD_EVENT, payload: eventData });
                setupSingleEventListener(change.doc.id);
              }
            } else if (change.type === "removed") {
              const unsubscribe = eventListeners.get(change.doc.id);
              if (unsubscribe) {
                unsubscribe();
                eventListeners.delete(change.doc.id);
              }
              dispatch({
                type: EVENT_ACTIONS.REMOVE_EVENT,
                payload: change.doc.id,
              });
            }
          });
        });

        dispatch({ type: EVENT_ACTIONS.SET_LOADING, payload: false });
      } catch (error) {
        console.error("❌ EventContext: Error setting up listeners:", error);
        dispatch({ type: EVENT_ACTIONS.SET_ERROR, payload: error.message });
        dispatch({ type: EVENT_ACTIONS.SET_LOADING, payload: false });
      }
    };

    const setupSingleEventListener = (eventId) => {
      if (eventListeners.has(eventId)) {
        return;
      }

      const eventDocRef = doc(db, "events", eventId);
      const unsubscribe = onSnapshot(
        eventDocRef,
        async (docSnap) => {
          if (!docSnap.exists()) {
            dispatch({ type: EVENT_ACTIONS.REMOVE_EVENT, payload: eventId });
            return;
          }
          const eventData = { id: docSnap.id, ...docSnap.data() };
          dispatch({ type: EVENT_ACTIONS.UPDATE_EVENT, payload: eventData });
          const memberIds = eventData.members || [];
          if (memberIds.length > 0) {
            try {
              const memberProfiles = await eventsService.getEventMembers(
                memberIds
              );
              dispatch({
                type: EVENT_ACTIONS.UPDATE_EVENT_MEMBERS,
                payload: {
                  eventId,
                  members: memberProfiles,
                },
              });
            } catch (error) {
              console.error(
                `❌ EventContext: Error fetching members for event ${eventId}:`,
                error
              );
            }
          } else {
            dispatch({
              type: EVENT_ACTIONS.SET_EVENT_MEMBERS,
              payload: { eventId, members: [] },
            });
          }
        },
        (error) => {
          console.error(
            `❌ EventContext: Listener error for event ${eventId}:`,
            error
          );
        }
      );
      eventListeners.set(eventId, unsubscribe);
    };

    setupEventListeners();
    return () => {
      eventListeners.forEach((unsubscribe, eventId) => {
        unsubscribe();
      });
      eventListeners.clear();
      if (unsubscribeEventInvitations) {
        unsubscribeEventInvitations();
      }
      if (unsubscribeUserEvents) {
        unsubscribeUserEvents();
      }
    };
  }, [currentUser?.uid]);

  const contextValue = {
    ...state,
    acceptEventInvitation,
    rejectEventInvitation,
    promoteToAdmin,
    demoteFromAdmin,
    removeEventMember,
    leaveEvent,
    getEventById,
    getEventMembers,
    isEventAdmin,
    isEventCreator,
    isEventMember,
    getUserEventRole,
  };

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  );
};

export const useEventContext = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEventContext must be used within an EventProvider");
  }
  return context;
};
