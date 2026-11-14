import type { WarehouseTransfer } from '@borngreataccounting/sdk-ts';

export type WarehouseTransferDetailDrawerContextValue = {
  warehouseTransfer: WarehouseTransfer | undefined;
  warehouseTransferId: number | null | undefined;
};
