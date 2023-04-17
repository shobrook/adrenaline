import { Component } from "react";
import { AiFillGithub } from "react-icons/ai";

// import "ExampleRepository.css";

export default class ExampleRepository extends Component {
    render() {
        const { onClick, children } = this.props;

        return (
            <div className="exampleRepository" onClick={onClick}>
                <AiFillGithub fill="white" size={22} />
                {children}
            </div>
        );
    }
}
