import { useEffect, useRef, useState } from 'react';
import { Building2, ImageUp, X } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/feedback/ToastContext';
import { validateLogoFile } from '@/lib/validation';

/** Logo picker with client-side file checks. The upload itself is wired up with the backend. */
export function BrandingCard() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Release the object URL when it is replaced or the card unmounts.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again after fixing an error
    if (!file) return;
    const problem = validateLogoFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setPreview(URL.createObjectURL(file));
    toast.info('Logo selected', 'It will be saved once the backend is connected');
  }

  return (
    <Card>
      <CardHeader title="Branding" subtitle="Upload company logo" />
      <CardBody>
        <div className="border-2 border-dashed border-surface-200 rounded-xl p-8 text-center">
          {preview ? (
            <img src={preview} alt="Selected logo preview" className="mx-auto mb-3 h-16 w-16 rounded-2xl object-contain ring-1 ring-surface-200" />
          ) : (
            <div className="h-16 w-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          )}
          <p className="text-sm font-medium text-surface-700">Company Logo</p>
          <p className="text-xs text-surface-400 mt-1">PNG or JPG, up to 2 MB</p>

          <input ref={inputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onFileChosen} aria-label="Choose logo file" />
          <div className="mt-3 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<ImageUp className="h-4 w-4" />} onClick={() => inputRef.current?.click()}>
              {preview ? 'Choose another' : 'Upload Logo'}
            </Button>
            {preview && (
              <Button variant="ghost" size="sm" leftIcon={<X className="h-4 w-4" />} onClick={() => { setPreview(null); setError(''); }}>
                Remove
              </Button>
            )}
          </div>
          {error && <p className="form-error mt-3" role="alert">{error}</p>}
        </div>
      </CardBody>
    </Card>
  );
}
