import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Upload, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { TransactionType } from '@/types';

interface ParsedRow {
  amount: number;
  type: TransactionType;
  category: string;
  notes: string;
  date: string;
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
}

export function CSVImportExport() {
  const { transactions, addTransaction, isAdding } = useTransactions();
  const { categories } = useCategories();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<string[][]>([]);
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredFields = ['amount', 'type', 'date'];
  const optionalFields = ['category', 'notes'];
  const allFields = [...requiredFields, ...optionalFields];

  const handleExport = () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const csvHeaders = ['Date', 'Type', 'Amount', 'Category', 'Notes'];
    const csvRows = transactions.map(t => [
      t.date,
      t.type,
      t.amount.toString(),
      t.category?.name || '',
      t.notes || ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(`Exported ${transactions.length} transactions`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV file must have headers and at least one data row');
        return;
      }

      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const csvHeaders = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
      const csvData = lines.slice(1).map(line => parseCSVLine(line));

      setHeaders(csvHeaders);
      setRawData(csvData);

      // Auto-map fields
      const autoMapping: Record<string, string> = {};
      allFields.forEach(field => {
        const matchIndex = csvHeaders.findIndex(h => 
          h.includes(field) || 
          (field === 'notes' && h.includes('description')) ||
          (field === 'type' && (h.includes('income') || h.includes('expense')))
        );
        if (matchIndex !== -1) {
          autoMapping[field] = matchIndex.toString();
        }
      });
      setFieldMapping(autoMapping);
      setStep('map');
    };
    reader.readAsText(file);
  };

  const processData = () => {
    const processed: ParsedRow[] = rawData.map((row, rowIndex) => {
      const errors: string[] = [];
      
      // Get values from mapping
      const amountStr = fieldMapping.amount !== undefined ? row[parseInt(fieldMapping.amount)] : '';
      const typeStr = fieldMapping.type !== undefined ? row[parseInt(fieldMapping.type)]?.toLowerCase() : '';
      const dateStr = fieldMapping.date !== undefined ? row[parseInt(fieldMapping.date)] : '';
      const categoryStr = fieldMapping.category !== undefined ? row[parseInt(fieldMapping.category)] : '';
      const notesStr = fieldMapping.notes !== undefined ? row[parseInt(fieldMapping.notes)] : '';

      // Validate amount
      const amount = parseFloat(amountStr?.replace(/[^0-9.-]/g, '') || '0');
      if (isNaN(amount) || amount <= 0) {
        errors.push('Invalid amount');
      }

      // Validate type
      let type: TransactionType = 'expense';
      if (typeStr.includes('income') || typeStr === 'in' || amount > 0 && typeStr.includes('+')) {
        type = 'income';
      } else if (typeStr.includes('expense') || typeStr === 'out' || typeStr.includes('-')) {
        type = 'expense';
      } else if (typeStr && typeStr !== 'income' && typeStr !== 'expense') {
        errors.push('Invalid type (must be income or expense)');
      }

      // Validate date
      let date = new Date().toISOString();
      if (dateStr) {
        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) {
          errors.push('Invalid date');
        } else {
          date = parsedDate.toISOString();
        }
      } else {
        errors.push('Date is required');
      }

      // Check for duplicates
      const isDuplicate = transactions.some(t => 
        Math.abs(Number(t.amount) - Math.abs(amount)) < 0.01 &&
        t.type === type &&
        t.date.split('T')[0] === date.split('T')[0]
      );

      return {
        amount: Math.abs(amount),
        type,
        category: categoryStr || '',
        notes: notesStr || '',
        date,
        isValid: errors.length === 0,
        errors,
        isDuplicate
      };
    });

    setParsedData(processed);
    setSelectedRows(new Set(processed.map((_, i) => i).filter(i => processed[i].isValid && !processed[i].isDuplicate)));
    setStep('preview');
  };

  const handleImport = async () => {
    const rowsToImport = parsedData.filter((_, i) => selectedRows.has(i));
    
    if (rowsToImport.length === 0) {
      toast.error('No rows selected for import');
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const row of rowsToImport) {
      try {
        // Find category by name
        const category = categories.find(c => 
          c.name.toLowerCase() === row.category.toLowerCase() && 
          (c.type === row.type || c.type === null)
        );

        await new Promise<void>((resolve, reject) => {
          addTransaction({
            amount: row.amount,
            type: row.type,
            category_id: category?.id,
            notes: row.notes || null,
            date: row.date
          }, {
            onSuccess: () => {
              successCount++;
              resolve();
            },
            onError: (error) => {
              errorCount++;
              reject(error);
            }
          });
        });
      } catch {
        errorCount++;
      }
    }

    setIsImporting(false);
    
    if (successCount > 0) {
      toast.success(`Imported ${successCount} transactions`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to import ${errorCount} transactions`);
    }

    resetImport();
  };

  const resetImport = () => {
    setIsImportOpen(false);
    setParsedData([]);
    setFieldMapping({});
    setHeaders([]);
    setRawData([]);
    setStep('upload');
    setSelectedRows(new Set());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const selectAll = () => {
    setSelectedRows(new Set(parsedData.map((_, i) => i).filter(i => parsedData[i].isValid)));
  };

  const deselectAll = () => {
    setSelectedRows(new Set());
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleExport} className="gap-2">
        <Download className="w-4 h-4" />
        Export CSV
      </Button>
      
      <Button variant="outline" onClick={() => setIsImportOpen(true)} className="gap-2">
        <Upload className="w-4 h-4" />
        Import CSV
      </Button>

      <Dialog open={isImportOpen} onOpenChange={(open) => !open && resetImport()}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Import Transactions from CSV</DialogTitle>
            <DialogDescription>
              {step === 'upload' && 'Upload a CSV file with your transactions'}
              {step === 'map' && 'Map CSV columns to transaction fields'}
              {step === 'preview' && 'Review and select transactions to import'}
            </DialogDescription>
          </DialogHeader>

          {step === 'upload' && (
            <div className="py-8">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Drag and drop or click to upload</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  Select CSV File
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Expected columns: Date, Type (income/expense), Amount, Category (optional), Notes (optional)
              </p>
            </div>
          )}

          {step === 'map' && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">Map your CSV columns to the required fields:</p>
              <div className="grid grid-cols-2 gap-4">
                {allFields.map(field => (
                  <div key={field} className="space-y-2">
                    <Label className="capitalize">
                      {field} {requiredFields.includes(field) && <span className="text-destructive">*</span>}
                    </Label>
                    <Select 
                      value={fieldMapping[field] || ''} 
                      onValueChange={(v) => setFieldMapping(prev => ({ ...prev, [field]: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- Not mapped --</SelectItem>
                        {headers.map((h, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {h || `Column ${i + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
                <Button 
                  onClick={processData}
                  disabled={!requiredFields.every(f => fieldMapping[f] !== undefined)}
                >
                  Preview Data
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedRows.size} of {parsedData.length} rows selected
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>Select All Valid</Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
                </div>
              </div>
              
              <ScrollArea className="h-[400px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, index) => (
                      <TableRow key={index} className={!row.isValid ? 'opacity-50' : ''}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedRows.has(index)}
                            onCheckedChange={() => toggleRow(index)}
                            disabled={!row.isValid}
                          />
                        </TableCell>
                        <TableCell>
                          {row.isValid ? (
                            row.isDuplicate ? (
                              <span className="flex items-center gap-1 text-warning text-xs">
                                <AlertCircle className="w-3 h-3" /> Duplicate?
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-income text-xs">
                                <CheckCircle2 className="w-3 h-3" /> Valid
                              </span>
                            )
                          ) : (
                            <span className="flex items-center gap-1 text-destructive text-xs">
                              <X className="w-3 h-3" /> {row.errors.join(', ')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{row.date.split('T')[0]}</TableCell>
                        <TableCell className="capitalize">{row.type}</TableCell>
                        <TableCell className={row.type === 'income' ? 'text-income' : 'text-expense'}>
                          {formatCurrency(row.amount)}
                        </TableCell>
                        <TableCell>{row.category || '-'}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{row.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <DialogFooter>
                <Button variant="outline" onClick={() => setStep('map')}>Back</Button>
                <Button 
                  onClick={handleImport}
                  disabled={selectedRows.size === 0 || isImporting}
                  className="gradient-primary text-primary-foreground"
                >
                  {isImporting ? 'Importing...' : `Import ${selectedRows.size} Transactions`}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
