import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ChatBot from "./Chatbot";
import AuthModal from "./AuthModal";

class Repository {
  constructor(owner, name, branch="main") {
    this.owner = owner;
    this.name = name;
    this.branch = branch;
    this.fullPath = `${owner}/${name}`;
  }
}

const Extension = () => {
  const [repository, setRepository] = useState(null);
  const { isLoading, isAuthenticated } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (router.isReady && Object.keys(router.query).length > 0) {
      const { owner, name } = router.query; // TODO: Pass in default branch as well, or get it from API
      setRepository(new Repository(owner, name));
    }
  }, [router.isReady, router.query])

  if (repository) {
    return (isAuthenticated ? (<ChatBot repository={repository} />) : (<AuthModal repository={repository} />));
  }

  return null
};

export default Extension;
