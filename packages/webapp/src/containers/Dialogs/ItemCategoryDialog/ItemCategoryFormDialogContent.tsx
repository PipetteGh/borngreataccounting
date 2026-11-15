import type { ItemCategory } from '@borngreataccounting/sdk-ts';
import React from 'react';
import { ItemCategoryForm } from './ItemCategoryForm';
import { ItemCategoryProvider } from './ItemCategoryProvider';

interface ItemCategoryFormDialogContentProps {
  itemCategoryId?: number | null;
  dialogName: string;
  action?: string;
  onCreated?: (category: ItemCategory) => void;
}

export function ItemCategoryFormDialogContent({
  itemCategoryId,
  dialogName,
  onCreated,
}: ItemCategoryFormDialogContentProps): React.ReactElement {
  return (
    <ItemCategoryProvider
      itemCategoryId={itemCategoryId}
      dialogName={dialogName}
    >
      <ItemCategoryForm onCreated={onCreated} />
    </ItemCategoryProvider>
  );
}
