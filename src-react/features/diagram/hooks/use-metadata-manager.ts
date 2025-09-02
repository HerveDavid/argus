import { useState, useEffect } from 'react';
import { Result } from '@effect-atom/atom-react';
import { useMetadata } from '../providers/metadata.provider';
import { SldMetadata } from '@/types/sld-metadata';

export const useMetadataManager = () => {
  const { metadata: metadataResult } = useMetadata();
  const [metadata, setMetadata] = useState<SldMetadata>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Result.match(metadataResult, {
      onFailure(error) {
        setError(error.cause.toString || 'Failed to load metadata');
        setIsLoading(false);
      },
      onInitial() {
        setIsLoading(true);
        setError(null);
      },
      onSuccess({ value }) {
        setMetadata(value.metadata);
        setIsLoading(false);
        setError(null);
      },
    });
  }, [metadataResult]);

  return { metadata, isLoading, error };
};
