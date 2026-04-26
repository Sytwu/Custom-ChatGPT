## ADDED Requirements

### Requirement: Sticker picker renders as fixed floating panel
The sticker picker SHALL render as a `position: fixed` overlay panel, positioned above the 🖼️ button, escaping any parent `overflow: hidden` constraints.

#### Scenario: Picker opens above input bar
- **WHEN** the user clicks the 🖼️ sticker button in Discord mode
- **THEN** a floating panel appears above the button with fixed height (~280px) and is fully visible regardless of parent container overflow

#### Scenario: Picker has internal scroll
- **WHEN** the sticker grid content exceeds the panel height
- **THEN** the grid area scrolls internally while the tab bar remains fixed at the top

#### Scenario: Picker closes on outside click
- **WHEN** the user clicks anywhere outside the sticker picker panel
- **THEN** the picker closes

#### Scenario: Picker closes on Escape key
- **WHEN** the sticker picker is open and the user presses Escape
- **THEN** the picker closes

#### Scenario: Picker position is relative to the sticker button
- **WHEN** the picker opens
- **THEN** its position is calculated from the sticker button's `getBoundingClientRect()` so it anchors to the button regardless of page layout
