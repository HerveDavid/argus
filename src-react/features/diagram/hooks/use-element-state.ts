import { useReducer } from 'react';
import { ElementInfo } from '../types/element-info.type';
import { Attribute } from '../types/attribute.type';

interface ElementState {
  elementInfo?: ElementInfo;
  attributes: Attribute[];
  contextMenuOpen: boolean;
}

type ElementAction =
  | { type: 'SET_ELEMENT_INFO'; payload: ElementInfo }
  | { type: 'SET_ATTRIBUTES'; payload: Attribute[] }
  | { type: 'SET_CONTEXT_MENU_OPEN'; payload: boolean }
  | { type: 'CLEAR_ELEMENT_DATA' };

const elementReducer = (
  state: ElementState,
  action: ElementAction,
): ElementState => {
  switch (action.type) {
    case 'SET_ELEMENT_INFO':
      return { ...state, elementInfo: action.payload };
    case 'SET_ATTRIBUTES':
      return { ...state, attributes: action.payload };
    case 'SET_CONTEXT_MENU_OPEN':
      return { ...state, contextMenuOpen: action.payload };
    case 'CLEAR_ELEMENT_DATA':
      return { ...state, elementInfo: undefined, attributes: [] };
    default:
      return state;
  }
};

const initialState: ElementState = {
  elementInfo: undefined,
  attributes: [],
  contextMenuOpen: false,
};

export const useElementState = () => {
  const [state, dispatch] = useReducer(elementReducer, initialState);

  const setElementInfo = (elementInfo: ElementInfo) =>
    dispatch({ type: 'SET_ELEMENT_INFO', payload: elementInfo });

  const setAttributes = (attributes: Attribute[]) =>
    dispatch({ type: 'SET_ATTRIBUTES', payload: attributes });

  const setContextMenuOpen = (open: boolean) =>
    dispatch({ type: 'SET_CONTEXT_MENU_OPEN', payload: open });

  const clearElementData = () => dispatch({ type: 'CLEAR_ELEMENT_DATA' });

  return {
    state,
    actions: {
      setElementInfo,
      setAttributes,
      setContextMenuOpen,
      clearElementData,
    },
  };
};
