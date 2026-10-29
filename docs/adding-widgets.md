# How to Add a New Widget

This guide explains the process of adding a new widget to the dashboard.

## Overview

Adding a widget involves 3 main steps:
1.  **Create the Widget Component**: The React component that renders the widget.
2.  **Register Metadata**: Define the widget's properties (name, size, category) in the registry.
3.  **Map the Component**: Link the type string to the actual component.

## Step-by-Step Guide

### 1. Create the Widget Component

Create a new directory in `app/components/widgets/` for your widget (e.g., `app/components/widgets/mytime/`).
Create a file `MyTimeWidget.tsx`.

It must accept `WidgetProps` and wrap its content in `BaseWidget`. You can also pass header buttons or status badges via the `actions` prop.

```tsx
// app/components/widgets/mytime/MyTimeWidget.tsx
import { BaseWidget } from '@/app/components/widgets/BaseWidget';
import { WidgetProps } from '@/app/types/widgets';
import { RefreshCw } from 'lucide-react';

export function MyTimeWidget({ widget, isEditMode, onRemove }: WidgetProps) {
    return (
        <BaseWidget 
            title="My Time" 
            isEditMode={isEditMode} 
            onRemove={onRemove}
            actions={
                <button 
                    onClick={() => console.log('Action triggered')}
                    className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
            }
        >
            <div className="flex items-center justify-center h-full">
                <h1 className="text-2xl font-bold text-white">Hello World</h1>
            </div>
        </BaseWidget>
    );
}
```

### 2. Update Widget Types

Add your new widget type string to `app/types/widgets.ts`.

```typescript
// app/types/widgets.ts
export type WidgetType = 
    | 'datetime' 
    | 'weather' 
    | 'my-time'; // Add your type here
```

### 3. Register Metadata

Add the widget's metadata to `app/lib/widgetRegistry.ts`. This controls how it appears in the "Add Widget" picker.

```typescript
// app/lib/widgetRegistry.ts
export const WIDGET_METADATA: Record<WidgetType, WidgetMetadata> = {
    // ... other widgets
    'my-time': {
        type: 'my-time',
        name: 'My Time',
        description: 'A custom time widget',
        category: 'Time', // Categories: 'System' | 'Apps' | 'Media' | 'Utilities'
        singleton: false, // Set to true if only one instance should be allowed
        icon: 'Clock', // Lucide icon name
        defaultSize: { w: 4, h: 2 },
        minSize: { w: 2, h: 2 }
    }
};
```

### 4. Map the Component

Map the type string to your component in both the main grid and the widget picker modal:

1. **`app/components/home/WidgetGrid.tsx`**:
   ```tsx
   import { MyTimeWidget } from '@/app/components/widgets/mytime/MyTimeWidget';

   const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType<any>> = {
       // ...
       'my-time': MyTimeWidget,
   };
   ```

2. **`app/components/home/WidgetPicker.tsx`** (for modal preview cards):
   ```tsx
   import { MyTimeWidget } from '@/app/components/widgets/mytime/MyTimeWidget';

   const WIDGET_PREVIEWS: Partial<Record<WidgetType, React.ComponentType<any>>> = {
       // ...
       'my-time': MyTimeWidget,
   };
   ```

## Icons
To add a new icon, update `getWidgetIcon` in `app/lib/widgetRegistry.ts` if the icon isn't already imported and mapped.

## That's it!
Your widget will now appear in the "Add Widget" picker under the category you specified.
