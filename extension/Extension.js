import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ChatBot from "./Chatbot";
import AuthModal from "./AuthModal";
import { Repository, IndexingStatus } from "./lib/dtos";

const Extension = () => {
  const [repository, setRepository] = useState(null);
  const { isLoading, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const router = useRouter();

  const updateIndexingStatus = indexingStatus => {
    setRepository(prevRepository => {
      prevRepository.indexingStatus = indexingStatus;
      return prevRepository;
    });
  }

  useEffect(() => {
    if (router.isReady && Object.keys(router.query).length > 0) {
      const { owner, name } = router.query; // TODO: Pass in default branch as well, or get it from API
      let repository = new Repository(owner, name);

      getAccessTokenSilently().then(token => {
        fetch(`${process.env.NEXT_PUBLIC_API_URI}api/codebase_metadata`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({codebase_id: `github/${repository.fullPath}`})
        }).then(res => res.json()).then(data => {
            const { is_private, is_indexed, num_commits_behind } = data;
            repository.isPrivate = is_private;
            repository.numCommitsBehind = num_commits_behind;

            if (!is_indexed) {
              repository.indexingStatus = IndexingStatus.NotIndexed;
            } else if (num_commits_behind > 0) {
              repository.indexingStatus = IndexingStatus.IndexedButStale;
            } else {
              repository.indexingStatus = IndexingStatus.Indexed;
            }

            setRepository(repository);
        });
      });
    }
  }, [router.isReady, router.query])

  if (repository) {
    return (isAuthenticated ? (
      <ChatBot repository={repository} updateIndexingStatus={updateIndexingStatus} />
    ) : (<AuthModal repository={repository} />));
  }

  return null
};

export default Extension;
