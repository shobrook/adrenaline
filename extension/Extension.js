import { useAuth0 } from '@auth0/auth0-react';
import * as React from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Chatbot from "./Chatbot";
import AuthModal from "./AuthModal";

class Repository {
  constructor(owner, name) {
    self.owner = owner;
    self.name = name;
    self.fullPath = `${owner}/${name}`;
  }
}

const Extension = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { loginWithRedirect, isLoading, isAuthenticated } = useAuth0();
  const router = useRouter();
  
  const { owner, name } = router.query;
  const repository = new Repository(owner, name);

  // TODO: leave this for noe commented. It might be needed
  // useEffect(() => {
  //   getAuth0userInfoRequest()
  //     .then(res => {
  //       console.log({ res });
  //       setIsAuth(true);
  //     })
  //     .catch(e => {
  //       setIsAuth(false);
  //       console.log(e);
  //     });
  // });

  useEffect(() => {
    const stylesheet = document.createElement('style');
    stylesheet.innerText = 'body, html { background-color: transparent; }';

    document.head.appendChild(stylesheet);
  }, []);

  const onCloseModal = () => window.parent.postMessage('closeIframe', '*');

  return (
    <div>
      {isModalOpen && (
        isAuthenticated ? (
          router.isReady && (
            <Chatbot 
              onCloseModal={onCloseModal} 
              repository={repository}
            />
          )
        ) : (<AuthModal onCloseModal={onCloseModal} />)
      )}
    </div>
  );
};

export default Extension;
