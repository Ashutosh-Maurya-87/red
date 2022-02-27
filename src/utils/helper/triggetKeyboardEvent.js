/**
 * Trigger Keyboard Event Programmatically

 * @param {*} param0 
 */
const triggetKeyboardEvent = ({
  type = 'keydown',
  bubbles = true,
  cancelable = true,
  view = window,
  ctrlKey = false,
  altKey = false,
  shiftKey = false,
  metaKey = false,
  keyCode,
  charCode = 0,
} = {}) => {
  // event type: keydown, keyup, keypress
  const evt = new KeyboardEvent(type, {
    bubbles, // bubbles
    cancelable, // cancelable
    view, // view: should be window
    ctrlKey, // ctrlKey
    altKey, // altKey
    shiftKey, // shiftKey
    metaKey, // metaKey
    keyCode, // keyCode: unsigned long - the virtual key code, else 0
    charCode, // charCode: unsigned long - the Unicode character associated with the depressed key, else 0
  });

  document.dispatchEvent(evt);
};

export default triggetKeyboardEvent;
