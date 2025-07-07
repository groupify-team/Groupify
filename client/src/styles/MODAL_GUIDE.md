# Smooth Modal System Guide

This guide explains how to implement smooth modal animations in the Groupify dashboard using our enhanced design system.

## Overview

The modal system includes:

- ✨ **Smooth animations** for open/close transitions
- 🖱️ **Backdrop click to close** functionality
- ⌨️ **Keyboard accessibility** (ESC to close)
- 🎨 **Multiple animation variants**
- 📱 **Responsive design**

## Quick Start

### Using the Enhanced Modal Component

```jsx
import { useModal } from "@/shared/hooks/useModal";
import Modal from "@/shared/components/ui/Modal";

function MyComponent() {
  const { isOpen, openModal, closeModal } = useModal();

  return (
    <>
      <button onClick={openModal} className="btn-primary">
        Open Modal
      </button>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title="My Modal"
        size="medium"
        animationType="slide-scale"
      >
        <p>Modal content goes here!</p>
      </Modal>
    </>
  );
}
```

## Animation Types

The modal component supports different animation variants:

### 1. Slide Scale (Default)

```jsx
<Modal animationType="slide-scale" />
```

- Slides in from above with a gentle scale effect
- Most visually appealing for most use cases

### 2. Fade In

```jsx
<Modal animationType="fade" />
```

- Simple fade in/out animation
- Subtle and clean

### 3. Scale

```jsx
<Modal animationType="scale" />
```

- Scales from center
- Good for confirmations

## Modal Sizes

```jsx
// Small modal (mobile-friendly)
<Modal size="small" />

// Medium modal (default)
<Modal size="medium" />

// Large modal (forms, content)
<Modal size="large" />

// Extra large modal (complex interfaces)
<Modal size="xlarge" />

// Fullscreen modal
<Modal size="fullscreen" />
```

## CSS Classes Available

### Backdrop Classes

- `.modal-backdrop` - Base backdrop styling
- `.modal-backdrop-clickable` - Cursor pointer for clickable areas
- `.animate-modal-backdrop-enter` - Backdrop entrance animation
- `.animate-modal-backdrop-exit` - Backdrop exit animation

### Content Classes

- `.modal-content` - Base modal content styling
- `.modal-content-enter` - Content entrance animation
- `.modal-content-exit` - Content exit animation
- `.modal-content-slide-scale` - Slide scale animation
- `.modal-content-protected` - Prevents backdrop clicks

### Component Classes

- `.modal-header` - Styled modal header
- `.modal-title` - Modal title styling
- `.modal-body` - Modal content area
- `.modal-footer` - Modal action area
- `.modal-close` - Enhanced close button

## Advanced Usage

### Custom Modal with Manual Classes

```jsx
function CustomModal({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div
          className="modal-backdrop animate-modal-backdrop-enter"
          onClick={onClose}
        >
          <div
            className="modal-content modal-md animate-slide-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">Custom Modal</h2>
              <button className="modal-close" onClick={onClose}>
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body">
              <p>Custom content here</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

### Managing Multiple Modals

```jsx
import { useModals } from "@/shared/hooks/useModal";

function DashboardComponent() {
  const { modals, openModal, closeModal, isOpen } = useModals({
    createTrip: false,
    editProfile: false,
    settings: false,
  });

  return (
    <>
      <button onClick={() => openModal("createTrip")}>Create Trip</button>

      <Modal
        isOpen={isOpen("createTrip")}
        onClose={() => closeModal("createTrip")}
        title="Create New Trip"
      >
        {/* Create trip form */}
      </Modal>
    </>
  );
}
```

## Migration from Existing Modals

To update existing modals for smooth animations:

### 1. Replace backdrop classes

```jsx
// Old
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm">

// New
<div className="modal-backdrop animate-modal-backdrop-enter">
```

### 2. Replace content classes

```jsx
// Old
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl">

// New
<div className="modal-content animate-slide-in-scale">
```

### 3. Add backdrop click handling

```jsx
// Add onClick to backdrop
<div className="modal-backdrop" onClick={onClose}>
  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
    {/* Content */}
  </div>
</div>
```

## Best Practices

1. **Always use backdrop click to close** unless the modal requires forced interaction
2. **Include ESC key handling** for accessibility
3. **Use appropriate animation types** based on modal purpose:
   - `slide-scale` for general purpose modals
   - `fade` for subtle notifications
   - `scale` for confirmations
4. **Choose proper sizes** based on content amount
5. **Test on mobile devices** to ensure responsive behavior

## Performance Tips

- The animations use CSS transforms which are hardware-accelerated
- Modal content is only rendered when needed
- Exit animations prevent jarring disappearances
- Body scroll is managed automatically

## Troubleshooting

### Modal doesn't close on backdrop click

- Ensure `closeOnBackdrop={true}` is set
- Check that `onClick={(e) => e.stopPropagation()}` is on modal content

### Animation feels slow/fast

- Adjust animation timing in `tokens.css`:
  - `--duration-slower` for entrance animations
  - `--duration-normal` for exit animations

### Z-index issues

- Use the `zIndex` prop to override default modal z-index
- Check Z_INDEX constants in `/shared/constants/ui`
