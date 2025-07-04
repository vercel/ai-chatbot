import React, { JSX } from "react";
import { useTranslation } from "react-i18next";
import { UserLanguageOption } from "@ai-chat/app/api/models";
import { languageTypes, useCoreContext } from "@ai-chat/app/core-context";
import { Dropdown } from "./dropdown";
import { CrossIcon } from "lucide-react";
import {
  GenericDialog,
  GenericDialogAction,
  GenericDialogContent,
  GenericDialogFooter,
  GenericDialogHeader,
  GenericDialogTitle,
} from "./generic-dialog";

export interface StatusModalProps {
  message?: React.ReactNode;
  title?: string;
  titleIcon?: JSX.Element;
  buttonIcon?: JSX.Element;
  buttonContent?: string;
  buttonModifier?: string;
  handleClick?: () => void;
  error?: JSX.Element;
  variant?: string;
  onClose?: () => void;
  open: boolean;
  buttonId?: string;
  hasDoubleButton?: boolean;
  buttonRightIcon?: JSX.Element;
  buttonRightContent?: string;
  handleRightClick?: () => void;
  handleLanguageTypeChange?: (Event?: any) => void;
  languageType?: UserLanguageOption | undefined;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  message,
  title,
  titleIcon,
  buttonIcon,
  buttonContent,
  buttonModifier,
  handleClick,
  error,
  variant,
  open,
  onClose,
  buttonId,
  hasDoubleButton,
  buttonRightContent,
  buttonRightIcon,
  handleRightClick,
  handleLanguageTypeChange,
  languageType,
}) => {
  const { t } = useTranslation();

  const { currentLanguageType, userSettings } = useCoreContext();

  return (
    <GenericDialog
      open={open}
      aria-labelledby="status-modal-title"
      aria-describedby="status-modal-content-message"
      //   onClose={onClose}
      //   role="dialog"
      //   id={open && variant === "termsOfUse" ? "terms-of-use-modal" : undefined}
    >
      <GenericDialogContent>
        <GenericDialogHeader>
          <GenericDialogTitle className="flex flex-row justify-between items-center">
            <div className="flex items-center">
              {titleIcon}
              {title}
            </div>
            {variant === "termsOfUse" && handleLanguageTypeChange && (
              <Dropdown
                id="language-setting-dropdown"
                value={
                  languageType?.key ||
                  userSettings?.defaultLanguage?.key ||
                  currentLanguageType?.key ||
                  ""
                }
                onChange={(event) => handleLanguageTypeChange(event)}
                options={languageTypes}
              />
            )}
            {variant === "settings" && (
              <CrossIcon
                role="button"
                className="close-icon"
                onClick={onClose}
                aria-label={t("fullPageStatus.closeWindowAriaLabel")}
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") && onClose?.()
                }
              />
            )}
          </GenericDialogTitle>
        </GenericDialogHeader>
        {message && (
          <div
            id="status-modal-content-message"
            className="status-modal__content-message"
          >
            {message}
          </div>
        )}

        <GenericDialogFooter className="flex flex-col sm:flex-col">
          {(error || buttonContent) && (
            <div
              className={`status-modal__cta-wrapper flex ${
                error ? "" : "status-modal__cta-wrapper--no-error justify-end"
              }`}
            >
              {error}
              {hasDoubleButton && buttonRightContent ? (
                <>
                  <GenericDialogAction
                    id={buttonId}
                    className={`cta-button-left mr-5`}
                    onClick={handleClick}
                    aria-label={buttonContent ? buttonContent : "Submit"}
                    // startIcon={buttonIcon}
                  >
                    {buttonContent}
                  </GenericDialogAction>

                  <GenericDialogAction
                    id={buttonId}
                    className={`cta-button-right`}
                    onClick={handleRightClick}
                    aria-label={buttonRightContent}
                    // endIcon={buttonRightIcon}
                  >
                    {buttonRightContent}
                  </GenericDialogAction>
                </>
              ) : (
                (buttonContent || buttonIcon) && (
                  <GenericDialogAction
                    id={buttonId}
                    className={`cta-button ${buttonModifier} self-end`}
                    onClick={handleClick}
                    aria-label={buttonContent ? buttonContent : "Submit"}
                  >
                    {buttonIcon}
                    {buttonContent}
                  </GenericDialogAction>
                )
              )}
            </div>
          )}
        </GenericDialogFooter>
      </GenericDialogContent>
    </GenericDialog>
  );
};
