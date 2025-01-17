import { Formik } from "formik";
import React, { useCallback } from "react";

import { FormChangeTracker } from "components/common/FormChangeTracker";

import {
  ConnectorDefinition,
  ConnectorDefinitionSpecification,
  SourceDefinitionSpecificationDraft,
} from "core/domain/connector";
import { FormikPatch } from "core/form/FormikPatch";
import { useFormChangeTrackerService, useUniqueFormId } from "hooks/services/FormChangeTracker";

import { ConnectorFormContextProvider } from "./connectorFormContext";
import { FormRootProps, FormRoot } from "./FormRoot";
import { ConnectorFormValues } from "./types";
import { useBuildForm } from "./useBuildForm";

export interface ConnectorFormProps extends Omit<FormRootProps, "formFields" | "castValues" | "groupStructure"> {
  formType: "source" | "destination";
  formId?: string;
  /**
   * Definition of the connector might not be available if it's not released but only exists in frontend heap
   */
  selectedConnectorDefinition?: ConnectorDefinition;
  selectedConnectorDefinitionSpecification?: ConnectorDefinitionSpecification | SourceDefinitionSpecificationDraft;
  onSubmit: (values: ConnectorFormValues) => Promise<void>;
  isEditMode?: boolean;
  formValues?: Partial<ConnectorFormValues>;
  connectorId?: string;
}

export const ConnectorForm: React.FC<ConnectorFormProps> = (props) => {
  const formId = useUniqueFormId(props.formId);
  const { clearFormChange } = useFormChangeTrackerService();

  const {
    formType,
    formValues,
    onSubmit,
    isEditMode,
    selectedConnectorDefinition,
    selectedConnectorDefinitionSpecification,
    connectorId,
  } = props;

  const { formFields, initialValues, validationSchema, groups } = useBuildForm(
    Boolean(isEditMode),
    formType,
    selectedConnectorDefinitionSpecification,
    formValues
  );

  const castValues = useCallback(
    (values: ConnectorFormValues) =>
      validationSchema.cast(values, {
        stripUnknown: true,
      }),
    [validationSchema]
  );

  const onFormSubmit = useCallback(
    async (values: ConnectorFormValues) => {
      const valuesToSend = castValues(values);
      await onSubmit(valuesToSend);
      clearFormChange(formId);
    },
    [clearFormChange, formId, castValues, onSubmit]
  );

  return (
    <Formik
      validateOnBlur
      validateOnChange
      validateOnMount
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onFormSubmit}
      enableReinitialize
    >
      {({ dirty }) => (
        <ConnectorFormContextProvider
          formType={formType}
          getValues={castValues}
          selectedConnectorDefinition={selectedConnectorDefinition}
          selectedConnectorDefinitionSpecification={selectedConnectorDefinitionSpecification}
          isEditMode={isEditMode}
          validationSchema={validationSchema}
          connectorId={connectorId}
        >
          <FormikPatch />
          <FormChangeTracker changed={dirty} formId={formId} />
          <FormRoot {...props} formFields={formFields} castValues={castValues} groupStructure={groups} />
        </ConnectorFormContextProvider>
      )}
    </Formik>
  );
};
