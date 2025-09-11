"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { usePersona } from "@/lib/persona/context";
import { EnergyInputSchema, type EnergyInput } from "@/lib/analysis/types";

// Schema para validação do formulário (sem persona, será adicionada depois)
const EnergyInputFormSchema = EnergyInputSchema.innerType().omit({
  persona: true,
});
type EnergyInputForm = Omit<EnergyInput, "persona">;

// Props do componente
interface EnergyInputProps {
  onSubmit: (data: EnergyInput) => void;
  onCancel?: () => void;
  initialData?: Partial<EnergyInput>;
  isLoading?: boolean;
}

/**
 * Componente EnergyInput - Formulário para entrada de dados de energia
 * Persona-aware com campos específicos para owner vs integrator
 */
export function EnergyInput({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: EnergyInputProps) {
  const { mode } = usePersona();
  const [fileData, setFileData] = useState<{
    name: string;
    content: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<EnergyInputForm>({
    resolver: zodResolver(EnergyInputFormSchema),
    defaultValues: initialData,
    mode: "onChange",
  });

  const watchedValues = watch();

  // Parser simplificado para CSV
  const parseCSVData = useCallback(
    (csvContent: string) => {
      try {
        const lines = csvContent.split("\n").filter((line) => line.trim());
        if (lines.length < 2) return;

        const headers = lines[0].toLowerCase().split(",");
        const data = lines.slice(1).map((line) => line.split(","));

        // Procura por colunas de consumo mensal
        const consumptionIndex = headers.findIndex(
          (h) =>
            h.includes("consumo") || h.includes("kwh") || h.includes("energia")
        );

        if (consumptionIndex !== -1) {
          const monthlyData = data
            .slice(0, 12) // Últimos 12 meses
            .map((row) =>
              Number.parseFloat(row[consumptionIndex]?.trim() || "0")
            )
            .filter((val) => !Number.isNaN(val) && val > 0);

          if (monthlyData.length > 0) {
            setValue("series_12m", monthlyData);
            const avgConsumption =
              monthlyData.reduce((sum, val) => sum + val, 0) /
              monthlyData.length;
            setValue("avg_kwh_month", Math.round(avgConsumption));
          }
        }
      } catch (error) {
        console.warn("Erro ao processar arquivo CSV:", error);
      }
    },
    [setValue]
  );

  // Handler para upload de arquivo
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validações básicas do arquivo
      if (file.size > 10 * 1024 * 1024) {
        // 10MB
        setFileError("Arquivo muito grande. Máximo 10MB.");
        return;
      }

      if (
        !file.name.toLowerCase().endsWith(".csv") &&
        !file.name.toLowerCase().endsWith(".xlsx") &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        setFileError("Formato não suportado. Use CSV, XLSX ou PDF.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileData({ name: file.name, content });
        setFileError(null);

        // Tenta extrair dados do arquivo (simplificado)
        if (file.name.toLowerCase().endsWith(".csv")) {
          parseCSVData(content);
        }
      };
      reader.readAsText(file);
    },
    [parseCSVData]
  );

  // Handler do submit
  const onFormSubmit = useCallback(
    (data: EnergyInputForm) => {
      const completeData: EnergyInput = {
        ...data,
        persona: mode,
      };
      onSubmit(completeData);
    },
    [onSubmit, mode]
  );

  // Campos específicos por persona
  const renderPersonaFields = () => {
    if (mode === "owner") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="avg_kwh_month">Consumo médio mensal (kWh)</Label>
              <Input
                id="avg_kwh_month"
                type="number"
                placeholder="Ex: 500"
                {...register("avg_kwh_month", { valueAsNumber: true })}
                className={errors.avg_kwh_month ? "border-red-500" : ""}
              />
              {errors.avg_kwh_month && (
                <p className="text-sm text-red-500">
                  {errors.avg_kwh_month.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tariff_rs_kwh">Tarifa atual (R$/kWh)</Label>
              <Input
                id="tariff_rs_kwh"
                type="number"
                step="0.01"
                placeholder="Ex: 0.85"
                {...register("tariff_rs_kwh", { valueAsNumber: true })}
                className={errors.tariff_rs_kwh ? "border-red-500" : ""}
              />
              {errors.tariff_rs_kwh && (
                <p className="text-sm text-red-500">
                  {errors.tariff_rs_kwh.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="series_12m">
              Série histórica (últimos 12 meses)
            </Label>
            <Textarea
              id="series_12m"
              placeholder="Cole aqui os valores mensais separados por vírgula (opcional)"
              {...register("series_12m")}
              className={errors.series_12m ? "border-red-500" : ""}
              rows={3}
            />
            {errors.series_12m && (
              <p className="text-sm text-red-500">
                {errors.series_12m.message}
              </p>
            )}
          </div>
        </div>
      );
    }

    // Integrator persona
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="size-4" />
          <AlertDescription>
            Para análise técnica completa, forneça dados detalhados do cliente.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="avg_kwh_month">Consumo médio mensal (kWh)</Label>
            <Input
              id="avg_kwh_month"
              type="number"
              placeholder="Ex: 2000"
              {...register("avg_kwh_month", { valueAsNumber: true })}
              className={errors.avg_kwh_month ? "border-red-500" : ""}
            />
            {errors.avg_kwh_month && (
              <p className="text-sm text-red-500">
                {errors.avg_kwh_month.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tariff_rs_kwh">Tarifa atual (R$/kWh)</Label>
            <Input
              id="tariff_rs_kwh"
              type="number"
              step="0.01"
              placeholder="Ex: 0.75"
              {...register("tariff_rs_kwh", { valueAsNumber: true })}
              className={errors.tariff_rs_kwh ? "border-red-500" : ""}
            />
            {errors.tariff_rs_kwh && (
              <p className="text-sm text-red-500">
                {errors.tariff_rs_kwh.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="utility">Concessionária</Label>
            <Input
              id="utility"
              placeholder="Ex: CEMIG, CPFL, etc."
              {...register("utility")}
              className={errors.utility ? "border-red-500" : ""}
            />
            {errors.utility && (
              <p className="text-sm text-red-500">{errors.utility.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="uf">Estado (UF)</Label>
          <Select
            onValueChange={(value) =>
              setValue(
                "uf",
                value as
                  | "AC"
                  | "AL"
                  | "AP"
                  | "AM"
                  | "BA"
                  | "CE"
                  | "DF"
                  | "ES"
                  | "GO"
                  | "MA"
                  | "MT"
                  | "MS"
                  | "MG"
                  | "PA"
                  | "PB"
                  | "PR"
                  | "PE"
                  | "PI"
                  | "RJ"
                  | "RN"
                  | "RS"
                  | "RO"
                  | "RR"
                  | "SC"
                  | "SP"
                  | "SE"
                  | "TO"
              )
            }
          >
            <SelectTrigger className={errors.uf ? "border-red-500" : ""}>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              {[
                "AC",
                "AL",
                "AP",
                "AM",
                "BA",
                "CE",
                "DF",
                "ES",
                "GO",
                "MA",
                "MT",
                "MS",
                "MG",
                "PA",
                "PB",
                "PR",
                "PE",
                "PI",
                "RJ",
                "RN",
                "RS",
                "RO",
                "RR",
                "SC",
                "SP",
                "SE",
                "TO",
              ].map((uf) => (
                <SelectItem key={uf} value={uf}>
                  {uf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.uf && (
            <p className="text-sm text-red-500">{errors.uf.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="series_12m">Dados históricos (CSV)</Label>
          <Textarea
            id="series_12m"
            placeholder="Cole dados CSV ou use upload de arquivo"
            {...register("series_12m")}
            className={errors.series_12m ? "border-red-500" : ""}
            rows={4}
          />
          {errors.series_12m && (
            <p className="text-sm text-red-500">{errors.series_12m.message}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5" />
          Dados de Energia
        </CardTitle>
        <CardDescription>
          {mode === "owner"
            ? "Forneça seus dados de consumo para análise de viabilidade"
            : "Insira os dados do cliente para análise técnica completa"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {renderPersonaFields()}

          {/* Upload de arquivo */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload de arquivo (opcional)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="size-4" />
                Escolher arquivo
              </Button>
              {fileData && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="size-4" />
                  {fileData.name}
                </div>
              )}
            </div>
            {fileError && <p className="text-sm text-red-500">{fileError}</p>}
            <p className="text-xs text-gray-500">
              Formatos aceitos: CSV, XLSX, PDF (máx. 10MB)
            </p>
          </div>

          {/* Preview dos dados */}
          {watchedValues.avg_kwh_month && (
            <Alert>
              <CheckCircle className="size-4" />
              <AlertDescription>
                <strong>Preview:</strong> Consumo médio de{" "}
                {watchedValues.avg_kwh_month} kWh/mês
                {watchedValues.tariff_rs_kwh &&
                  ` a R$ ${watchedValues.tariff_rs_kwh}/kWh`}
              </AlertDescription>
            </Alert>
          )}

          {/* Botões de ação */}
          <div className="flex gap-4 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={!isValid || isLoading}
              className="flex-1"
            >
              {isLoading ? "Analisando..." : "Analisar Viabilidade"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
