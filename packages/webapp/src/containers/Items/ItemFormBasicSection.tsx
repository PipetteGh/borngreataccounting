import {
  Button,
  Intent,
  MenuItem,
  Position,
  Radio,
  Tooltip,
} from '@blueprintjs/core';
import classNames from 'classnames';
import { useFormikContext } from 'formik';
import React, { useRef, useEffect } from 'react';
import intl from 'react-intl-universal';
import { getItemUnitOptions } from './constants';
import { useItemFormContext } from './ItemFormProvider';
import { ItemFormSectionTitle } from './ItemFormSectionTitle';
import {
  AppToaster,
  FCheckbox,
  FieldRequiredHint,
  FormattedMessage as T,
  FFormGroup,
  FRadioGroup,
  FSelect,
  FInputGroup,
  Box,
} from '@/components';
import { DialogsName } from '@/constants/dialogs';
import { useCreateItemCategory } from '@/hooks/query';
import { useDialogActions } from '@/hooks/state/dashboard';

export function ItemFormBasicSection() {
  const { openDialog } = useDialogActions();
  const { isNewMode, item, itemsCategories } = useItemFormContext();
  const { setFieldValue } = useFormikContext<any>();
  const { mutateAsync: createItemCategoryMutate } = useCreateItemCategory();
  const nameFieldRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (nameFieldRef.current) {
      nameFieldRef.current.focus();
    }
  }, []);

  const itemTypeHintContent = (
    <>
      <div className="mb1">
        <span
          dangerouslySetInnerHTML={{
            __html: intl.formatHTMLMessage({
              id: 'services_that_you_provide_to_customers',
            }),
          }}
        />
      </div>
      <div className="mb1">
        <span
          dangerouslySetInnerHTML={{
            __html: intl.formatHTMLMessage({
              id: 'products_you_buy_and_or_sell',
            }),
          }}
        />
      </div>
    </>
  );

  const handleOpenNewCategoryDialog = () => {
    openDialog(DialogsName.ItemCategoryForm, {
      action: 'new',
      onCreated: (created: any) => {
        if (created?.id) {
          setFieldValue('categoryId', created.id);
        }
      },
    });
  };

  const handleQuickCreateCategory = async (createdItem: { name: string }) => {
    const trimmedName = createdItem?.name?.trim();
    if (!trimmedName) {
      handleOpenNewCategoryDialog();
      return;
    }
    try {
      const created = await createItemCategoryMutate({
        name: trimmedName,
      } as any);
      if (created?.id) {
        setFieldValue('categoryId', created.id);
      }
      AppToaster.show({
        message: intl.get('the_item_category_has_been_created_successfully'),
        intent: Intent.SUCCESS,
      });
    } catch {
      handleOpenNewCategoryDialog();
    }
  };

  const createCategoryRenderer = (
    query: string,
    active: boolean,
    handleClick: React.MouseEventHandler<HTMLElement>,
  ) => (
    <MenuItem
      icon="add"
      text={intl.get('list.create', { value: `"${query}"` })}
      active={active}
      onClick={handleClick}
    />
  );

  return (
    <Box data-section-id="primary">
      <ItemFormSectionTitle>Basic details</ItemFormSectionTitle>

      {/*----------- Item type ----------*/}
      <FFormGroup
        name={'type'}
        label={intl.get('item_type')}
        labelInfo={
          <span>
            <FieldRequiredHint />
            <Tooltip
              content={itemTypeHintContent}
              position={Position.BOTTOM_LEFT}
            />
          </span>
        }
        className={classNames('form-group--item-type')}
        inline={true}
        fastField
      >
        <FRadioGroup
          name={'type'}
          inline={true}
          disabled={!isNewMode && item?.type === 'inventory'}
          fastField
        >
          <Radio label={intl.get('service')} value="service" />
          <Radio label={intl.get('inventory')} value="inventory" />
        </FRadioGroup>
      </FFormGroup>

      {/*----------- Item name ----------*/}
      <FFormGroup
        name={'name'}
        label={<T id={'item_name'} />}
        labelInfo={<FieldRequiredHint />}
        inline={true}
        fastField
      >
        <FInputGroup
          name={'name'}
          inputRef={(ref: HTMLInputElement | null) => {
            nameFieldRef.current = ref;
          }}
          fastField
          fill
        />
      </FFormGroup>

      {/*----------- SKU ----------*/}
      <FFormGroup
        name={'code'}
        label={<T id={'item_code'} />}
        inline={true}
        fastField
      >
        <FInputGroup name={'code'} fastField fill />
      </FFormGroup>

      {/*----------- Unit ----------*/}
      <FFormGroup
        name={'unit'}
        label={<T id={'item_unit'} />}
        labelInfo={<FieldRequiredHint />}
        inline={true}
      >
        <FSelect
          name={'unit'}
          items={getItemUnitOptions()}
          valueAccessor={'value'}
          textAccessor={'label'}
          placeholder={<T id={'select_unit'} />}
          popoverProps={{ minimal: true, captureDismiss: true }}
          fill
        />
      </FFormGroup>

      {/*----------- Item category ----------*/}
      <FFormGroup
        name={'categoryId'}
        label={<T id={'category'} />}
        inline={true}
      >
        <div style={{ display: 'flex', gap: 6, width: '100%' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <FSelect
              name={'categoryId'}
              items={itemsCategories}
              valueAccessor={'id'}
              textAccessor={'name'}
              placeholder={<T id={'select_category'} />}
              popoverProps={{ minimal: true, captureDismiss: true }}
              createNewItemRenderer={createCategoryRenderer}
              createNewItemFromQuery={(name: string) => ({ name })}
              onCreateItemSelect={handleQuickCreateCategory}
              noResults={
                <MenuItem
                  icon="add"
                  text={intl.get('sidebar.new_item_category')}
                  onClick={handleOpenNewCategoryDialog}
                />
              }
              fill
            />
          </div>
          <Button
            type="button"
            icon="plus"
            title={intl.get('sidebar.new_item_category')}
            onClick={handleOpenNewCategoryDialog}
          />
        </div>
      </FFormGroup>

      {/*----------- Active ----------*/}
      <FFormGroup
        name={'active'}
        inline={true}
        className={classNames('form-group--active')}
        fastField
      >
        <FCheckbox
          name={'active'}
          inline={true}
          labelElement={<T id={'active'} />}
          fastField
        />
      </FFormGroup>
    </Box>
  );
}
