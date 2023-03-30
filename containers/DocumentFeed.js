import { Component } from "react";

import Message from "./Message";
import Mixpanel from "../library/mixpanel";
export default class DocumentFeed extends Component {
    /* Lifecycle Methods */

    render() {
        const { documents } = this.props;

        return (
            <div id="documentFeed">
                {documents.reverse().map(document => {
                    const { content } = document;

                    return (
                        <Message
                            isResponse
                            isComplete
                            isPaywalled={false}
                        >
                            {content}
                        </Message>
                    );
                })}
            </div>
        );
    }
}