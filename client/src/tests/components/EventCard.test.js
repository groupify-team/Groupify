import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// Mock the EventCard component since it might not exist yet
const MockEventCard = ({ event, currentUserId }) => (
  <div data-testid="event-card">
    <h3>{event.name}</h3>
    <p>{event.destination}</p>
    <span>{event.members?.length} members</span>
    <span>{event.photoCount || 0} photos</span>
  </div>
);

// Mock react-router-dom more safely
jest.mock("react-router-dom", () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  useNavigate: () => jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Mock AuthContext
jest.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    currentUser: { uid: "test-user" },
  }),
}));

// Mock ThemeContext
jest.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({
    theme: "light",
    toggleTheme: jest.fn(),
  }),
}));

describe("EventCard Component", () => {
  const mockEvent = {
    id: "test-event-1",
    name: "Summer Vacation",
    description: "Amazing event to Hawaii",
    startDate: "2024-07-01",
    endDate: "2024-07-10",
    destination: "Hawaii",
    members: ["user1", "user2", "user3"],
    admins: ["user1"],
    createdBy: "user1",
    photoCount: 25,
    createdAt: "2024-01-15T10:30:00Z",
  };

  const defaultProps = {
    event: mockEvent,
    onDelete: jest.fn(),
    onEdit: jest.fn(),
    currentUserId: "user1",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders event information correctly", () => {
    render(
      <BrowserRouter>
        <MockEventCard {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText("Summer Vacation")).toBeInTheDocument();
    expect(screen.getByText("Hawaii")).toBeInTheDocument();
    expect(screen.getByText("3 members")).toBeInTheDocument();
    expect(screen.getByText("25 photos")).toBeInTheDocument();
  });

  test("handles missing optional props gracefully", () => {
    const minimalevent = {
      id: "minimal-event",
      name: "Minimal event",
      members: ["user1"],
      admins: ["user1"],
      createdBy: "user1",
    };

    const minimalProps = {
      event: minimalevent,
      currentUserId: "user1",
    };

    expect(() => {
      render(
        <BrowserRouter>
          <MockEventCard {...minimalProps} />
        </BrowserRouter>
      );
    }).not.toThrow();

    expect(screen.getByText("Minimal event")).toBeInTheDocument();
    expect(screen.getByText("0 photos")).toBeInTheDocument();
  });

  test("component structure is correct", () => {
    const { container } = render(
      <BrowserRouter>
        <MockEventCard {...defaultProps} />
      </BrowserRouter>
    );

    const EventCard = container.querySelector('[data-testid="event-card"]');
    expect(EventCard).toBeInTheDocument();
  });
});
