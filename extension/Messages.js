class Messages extends Component {
    onScroll(event) {
        const { messages } = this.props;
        const { scrollTop: scrollPosition } = e.currentTarget;

        if (this.oldScroll > scrollPosition && !messages[messages.length - 1].isComplete) {
            this.disableAutoScroll = true;
        }

        this.oldScroll = scrollPosition;
    }

    render() {
        const { messages } = this.props;

        return (
            <div className="messages" onScroll={this.onScroll}>
                
            </div>
        )
    }
}