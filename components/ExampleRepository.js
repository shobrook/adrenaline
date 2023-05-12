import { Component } from "react";
import { AiFillGithub, AiFillGitlab } from "react-icons/ai";
import { BsArrowRight } from "react-icons/bs";

export default class ExampleRepository extends Component {
    render() {
        const { onClick, isGitLab, children } = this.props;

        return (
            <div className="exampleRepository" onClick={onClick}>
                <div className="exampleRepositoryLink">
                    {isGitLab ? (
                        <AiFillGitlab fill="white" size={22} />
                    ) : (
                        <AiFillGithub fill="white" size={22} />
                    )}
                    {children}
                </div>
                <BsArrowRight fill="white" size={22} />
            </div>
        );
    }
}
