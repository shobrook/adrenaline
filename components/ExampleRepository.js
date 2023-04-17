import { Component } from "react";
import { AiFillGithub } from "react-icons/ai";
import { BsArrowRight } from "react-icons/bs";

// import "ExampleRepository.css";

export default class ExampleRepository extends Component {
    render() {
        const { onClick, children } = this.props;

        return (
            <div className="exampleRepository" onClick={onClick}>
                <div className="exampleRepositoryLink">
                    <AiFillGithub fill="white" size={22} />
                    {children}
                </div>
                <BsArrowRight fill="white" size={22} />
            </div>
        );
    }
}
