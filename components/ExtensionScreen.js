// import './ExtensionScreen.module.css';

import { useAuth0 } from '@auth0/auth0-react';
import * as React from 'react';
import { useEffect, useState } from 'react';
import Button from "/components/Button";
import ChatBot from "/containers/ChatBot";
import {Modal} from "@mui/material";

const ExtensionScreen = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  const [isAuth, setIsAuth] = useState(false);
  const [isModalOpen, setIsOpenModal] = useState(true);

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
    setIsAuth(isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    const stylesheet = document.createElement('style');
    stylesheet.innerText = 'body, html { background-color: transparent; }';

    document.head.appendChild(stylesheet);
  }, []);

  return (
    <div>
      {isModalOpen && (
        <Modal open={true}>
          {isAuth ? (
            <ChatBot
              closeModal={() => {
                window.parent.postMessage('closeIframe', '*');
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                height: '500px',
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'silver',
              }}
            >
              <Button
                variant="primary"
                type="button"
                style={{ textAlign: 'center' }}
                onClick={() => {
                  window.open(window.location.origin, '_blank');
                }}
              >
                Login to Adrenaline
              </Button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
export default ExtensionScreen;
