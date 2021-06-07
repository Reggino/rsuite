import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Collapse from '../Animation/Collapse';
import MenuContext from './MenuContext';

import { mergeRefs, useClassNames, KEY_VALUES } from '../utils';

import { IconProps } from '@rsuite/icons/lib/Icon';
import { StandardProps } from '../@types/common';
import useEnsuredRef from '../utils/useEnsuredRef';
import MenuControlContext from './MenuControlContext';
import useUniqueId from '../utils/useUniqueId';
import useMenuControl from './useMenuControl';

export interface MenuProps<T = string> extends StandardProps {
  /** Define the title as a submenu */
  title?: React.ReactNode;

  /** The submenu expands from the left and defaults to the right */
  pullLeft?: boolean;

  /**
   *  Only used for setting the default expand state when it's a submenu.
   *  Used in conjunction with `openKeys` from parents
   */
  eventKey?: T;

  /** Set the icon */
  icon?: React.ReactElement<IconProps>;

  open?: boolean;
  openKeys?: T[];
  collapsible?: boolean;
  expanded?: boolean;
  active?: boolean;
  activeKey?: T;
  trigger?: 'hover' | 'click';
  onSelect?: (eventKey: T, event: React.SyntheticEvent<Element>) => void;
  onToggle?: (eventKey: T, event: React.SyntheticEvent<Element>) => void;
}

const defaultProps: Partial<MenuProps> = {
  openKeys: [],
  classPrefix: 'dropdown-menu'
};

/**
 * If <Dropdown.Menu> is inside another <Dropdown.Menu>,
 * it renders a `menuitem` and a `menu`.
 * Otherwise it renders the `menu` alone.
 */
const Menu = React.forwardRef(
  (props: MenuProps & Omit<React.HTMLAttributes<HTMLUListElement>, 'title' | 'onSelect'>, ref) => {
    const {
      children,
      className,
      classPrefix,
      collapsible: collapsibleProp,
      expanded,
      activeKey,
      openKeys,
      onSelect,
      ...rest
    } = props;

    const { withClassPrefix, merge, prefix } = useClassNames(classPrefix);
    const menuRef = useEnsuredRef<HTMLUListElement>(ref);
    const menuId = useUniqueId(prefix`-`);

    const parentMenu = useContext(MenuContext);
    const upperMenuControl = useContext(MenuControlContext);
    const menuControl = useMenuControl(menuRef, upperMenuControl);

    const collapsible = collapsibleProp ?? parentMenu?.collapsible;

    const renderCollapse = (children, expanded?: boolean) => {
      return collapsible ? (
        <Collapse
          in={expanded}
          exitedClassName={prefix`collapse-out`}
          exitingClassName={prefix`collapsing`}
          enteredClassName={prefix`collapse-in`}
          enteringClassName={prefix`collapsing`}
        >
          {children}
        </Collapse>
      ) : (
        children()
      );
    };

    // Ref: https://www.w3.org/TR/wai-aria-practices-1.2/#wai-aria-roles-states-and-properties-13
    const menuAriaAttributes: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLUListElement>,
      HTMLUListElement
    > = {
      role: 'menu',
      'aria-activedescendant': menuControl.items[menuControl.activeItemIndex]?.id
    };

    /**
     * Keyboard interaction on menu
     * @see https://www.w3.org/TR/wai-aria-practices-1.2/#keyboard-interaction-12
     */
    const handleKeydown = useCallback(
      (e: React.KeyboardEvent<HTMLUListElement>) => {
        switch (e.key) {
          // Move focus to previous item
          case KEY_VALUES.UP:
            e.preventDefault();
            e.stopPropagation();
            menuControl.moveItemFocus(-1);
            break;
          // Move focus to next item
          case KEY_VALUES.DOWN:
            e.preventDefault();
            e.stopPropagation();
            menuControl.moveItemFocus(1);
            break;
          // Move focus to the first item
          case KEY_VALUES.HOME:
            e.preventDefault();
            e.stopPropagation();
            menuControl.focusItemAt(0);
            break;
          // Move focus to the last item
          case KEY_VALUES.END:
            e.preventDefault();
            e.stopPropagation();
            menuControl.focusItemAt(menuControl.items.length - 1);
            break;

          // - When focus is on a menuitem that has a submenu, opens the submenu and places focus on its first item.
          // - Otherwise, activates the item and closes the menu.
          case KEY_VALUES.ENTER:
            const activeItem = menuControl.items[menuControl.activeItemIndex];
            if (activeItem) {
              e.preventDefault();
              e.stopPropagation();
              activeItem.click();
            }
            break;
          //  Close the menu that contains focus and return focus to the element or context,
          //  e.g., menu button or parent menuitem, from which the menu was opened.
          case KEY_VALUES.ESC:
            // No action here.
            // Handle this event in upper controlling context
            // See <Dropdown> and <MenuItem>
            break;
          default:
            break;
        }

        rest.onKeyDown?.(e);
      },
      [rest.onKeyDown, menuControl]
    );

    const menuEventHandlers: React.HTMLAttributes<HTMLUListElement> = {
      onKeyDown: handleKeydown
    };

    const classes = merge(className, withClassPrefix());
    const menuElement = renderCollapse((transitionProps, transitionRef) => {
      const { className: transitionClassName, ...transitionRestProps } = transitionProps || {};

      return (
        <ul
          id={menuId}
          {...rest}
          {...transitionRestProps}
          className={classNames(classes, transitionClassName)}
          ref={mergeRefs(transitionRef, menuRef)}
          tabIndex={0}
          {...menuAriaAttributes}
          {...menuEventHandlers}
        >
          {children}
        </ul>
      );
    }, expanded);

    return (
      <MenuContext.Provider
        value={{
          activeKey,
          openKeys,
          collapsible,
          onSelect
        }}
      >
        <MenuControlContext.Provider value={menuControl}>{menuElement}</MenuControlContext.Provider>
      </MenuContext.Provider>
    );
  }
);

Menu.displayName = 'Menu';
Menu.defaultProps = defaultProps;
Menu.propTypes = {
  active: PropTypes.bool,
  activeKey: PropTypes.any,
  className: PropTypes.string,
  children: PropTypes.node,
  icon: PropTypes.any,
  classPrefix: PropTypes.string,
  pullLeft: PropTypes.bool,
  title: PropTypes.node,
  open: PropTypes.bool,
  trigger: PropTypes.oneOf(['click', 'hover']),
  eventKey: PropTypes.any,
  openKeys: PropTypes.array,
  expanded: PropTypes.bool,
  collapsible: PropTypes.bool,
  onSelect: PropTypes.func,
  onToggle: PropTypes.func
};

export default Menu;