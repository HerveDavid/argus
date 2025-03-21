export const findParentWithId = (element: Element): Element | null => {
    let current = element;
    while (current && !current.id) {
      if (current.parentElement) {
        current = current.parentElement;
      } else {
        return null;
      }
    }
    return current;
  };