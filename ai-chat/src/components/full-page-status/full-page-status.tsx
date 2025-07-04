import { Api } from "@ai-chat/app/api/api";
import { UserLanguageOption } from "@ai-chat/app/api/models";
import { languageTypes, useCoreContext } from "@ai-chat/app/core-context";
import i18next from "i18next";
import { FC, ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusModal } from "../ui/status-modal";
import {
  CheckIcon,
  ExternalLink,
  Info,
  InfoIcon,
  RefreshCcw,
  SettingsIcon,
  TriangleAlert,
} from "lucide-react";
import { Markdown } from "../markdown";

interface FullPageStatusProps {
  message?: string;
  isLoading?: boolean;
  isOverlay?: boolean;
  children?: ReactNode;
  variant?: "noModes" | "noCoreData" | "termsOfUse" | "settings";
}

const SMTCatalogItemLink =
  "https://smt.ext.icrc.org/esc?id=sc_cat_item&sys_id=e4a1f648cd8c6a90078ad7cac21c584d";

const clearStorageAndRefresh = () => {
  localStorage?.clear?.(); // in some cases Azure OAuth JWT needs to be renewed
  window?.location?.reload?.();
};

enum ProcessingOptions {
  Processing = "processing",
  Done = "done",
  Error = "error",
  Initial = "initial",
}

declare global {
  interface Window {
    _mtm: any[];
  }
}

// aux component to render a full page status.
// Can optionally render as an overlay in front of children.
const FullPageStatus: FC<FullPageStatusProps> = ({
  message,
  isLoading,
  isOverlay,
  children,
  variant,
}) => {
  const {
    user,
    setTouValid,
    touValid,
    setIsOpenUserSettings,
    userSettings,
    currentLanguageType,
    setCurrentLanguageType,
  } = useCoreContext();
  const [processing, setProcessing] = useState<ProcessingOptions>(
    ProcessingOptions.Initial
  );
  const [errorTOU, setErrorTOU] = useState<unknown>();
  const [openTOU, setOpenTOU] = useState<boolean>(true);
  const versionDate = user?.tou?.version || "";
  const { t } = useTranslation();
  const [initialLanguage, setInitialLanguage] = useState<
    UserLanguageOption | undefined
  >(userSettings?.defaultLanguage || currentLanguageType);
  const [TOUContent, setTOUContent] = useState(user?.tou?.content);

  useEffect(() => {
    if (variant === "termsOfUse" && touValid) {
      window._mtm = window._mtm || [];
      window._mtm.push({
        event: "session-ready",
      });
    }
  }, [variant, touValid]);

  const acceptTermsOfUse = async (version: string) => {
    setProcessing(ProcessingOptions.Processing);
    try {
      await Api.postTOU(version).then((result) => {
        setProcessing(ProcessingOptions.Done);
        setOpenTOU(false);
        setTouValid(true);
      });
    } catch (error) {
      console.error("Failed to accept tou:", error);
      setProcessing(ProcessingOptions.Error);
      setErrorTOU(error);
    }
  };

  const handleLanguageTypeChange = async (event: string) => {
    const selectedKey = event;
    const selectedLanguage = languageTypes?.find(
      (language) => language.key === selectedKey
    );
    if (selectedLanguage) {
      setCurrentLanguageType(selectedLanguage);
      setInitialLanguage(selectedLanguage);
      i18next.changeLanguage(selectedLanguage?.key);
    }
    await Api.postLanguageType({
      language: selectedLanguage?.key || currentLanguageType?.key,
    }).then((result) => {
      setTOUContent(result.content);
    });
  };

  const getIncidentUrl = (): string => {
    const correlationId = Api.getCorrelationId();
    return (
      "https://smt.ext.icrc.org/esc" +
      "?id=sc_cat_item&sys_id=d05584bc703e2550262dfaa747994d6e" + // 'ICT internal request' catalog item
      "&service=05fd7e08340f021073281257c2f34ced" + // 'ICT internal request' "Service" field - X by default
      "&group=f7518d3df488625073280ff443bd4e06" + // 'ICT internal request' "Choose the assignment team" field - AI L2 Support by default
      `${correlationId && `&correlation_id=${correlationId}`}`
    ); // 'ICT internal request' "Describe your request" field with the correlation Id, if it exists
  };

  const handleOpenTicketOrReportErrorUrl = (): void => {
    window.open(getIncidentUrl(), "_blank", "noopener,noreferrer");
  };

  const variantModalProps = {
    noModes: {
      title: t("fullPageStatus.noAvailableChatModes"),
      message: (
        <>
          <p>{t("fullPageStatus.noAccessChatModes")}</p>
          <p>
            {t("fullPageStatus.requestAccess1")}{" "}
            <a
              href={`${SMTCatalogItemLink}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("fullPageStatus.SMTCatalogItemLink")}
            </a>{" "}
            {t("fullPageStatus.requestAccess2")}
          </p>
          <p>{t("fullPageStatus.existingAccess")}</p>
        </>
      ),
      titleIcon: <TriangleAlert className="title-icon title-icon--warning" />,
      buttonContent: t("fullPageStatus.retry"),
      buttonIcon: <RefreshCcw className="cta-button-icon" />,
      handleClick: clearStorageAndRefresh,
      open: true,
    },
    noCoreData: {
      title: t("fullPageStatus.serviceTemporarilyUnavailable"),
      message: (
        <>
          <p>{t("fullPageStatus.technicalIssues")}</p>
          <p>{t("fullPageStatus.assistance")}</p>
        </>
      ),
      titleIcon: <TriangleAlert className="title-icon title-icon--warning" />,
      buttonContent: t("fullPageStatus.retry"),
      buttonIcon: <RefreshCcw className="cta-button-icon" />,
      handleClick: clearStorageAndRefresh,
      open: true,
      hasDoubleButton: true,
      buttonRightContent: t("fullPageStatus.openTicket"),
      buttonRightIcon: <ExternalLink className="cta-button-right-icon" />,
      handleRightClick: handleOpenTicketOrReportErrorUrl,
    },
    termsOfUse: {
      title: t("fullPageStatus.termsOfUse"),
      message: (
        <div className="terms-of-use-wrapper">
          <Markdown>{TOUContent}</Markdown>
        </div>
      ),
      titleIcon: <InfoIcon className="title-icon" />,
      buttonContent:
        processing === "processing"
          ? t("fullPageStatus.processing")
          : t("fullPageStatus.accept"),
      buttonModifier:
        processing === "processing" ? "cta-button--processing" : "",
      buttonIcon:
        processing === "processing" ? undefined : (
          <CheckIcon className="cta-button-icon" />
        ),
      buttonId: "btn-accept-terms-of-use",
      handleClick: () => acceptTermsOfUse(versionDate),
      error: errorTOU ? (
        <div className="error-wrapper" role="alert">
          <InfoIcon className="error-wrapper__icon" />
          <span className="error-wrapper__content">
            {t("fullPageStatus.errorProcessingRequest")}
          </span>
        </div>
      ) : undefined,
      open: openTOU,
      handleLanguageTypeChange: handleLanguageTypeChange,
      languageType: initialLanguage,
    },
    settings: {
      title: t("fullPageStatus.settings"),
      message: <div className="settings-wrapper">{/* <UserSettings /> */}</div>,
      titleIcon: <SettingsIcon className="title-icon" />,
      handleClick: () => {},
      open: true,
      onClose: () => setIsOpenUserSettings(false),
    },
  };

  if (variant && variantModalProps[variant]) {
    const modalProps = variantModalProps[variant];

    return <StatusModal {...modalProps} variant={variant} />;
  }

  return (
    <>
      {(isLoading || message) && (
        <div
          className={`full-page-status__content ${isOverlay ? "overlay" : ""}`}
          aria-live="assertive"
          role="alert"
          aria-busy="true" // indicate that loading content blocks interaction
        >
          {/* TODO: ADD SPINNER */}
          {/* {isLoading && <CircularSpinner />} */}
          {message && (
            <p className="full-page-status__content-message" aria-live="polite">
              {message}
            </p>
          )}
        </div>
      )}
      <div aria-hidden={isLoading ? "true" : "false"}>{children}</div>
    </>
  );
};

export default FullPageStatus;
