import { OverlayTrigger, Tooltip, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PencilSquare, Trash, StarFill, ArrowUp, ArrowDown, ArrowRight, ArrowLeft, BoxArrowInRight, BoxArrowRight } from 'react-bootstrap-icons';

function ErrorAlert(props) {
    return (
        <Alert variant="danger" onClose={() => props.setErrorMessage('')} dismissible>
            <Alert.Heading>Oh snap! You got an error!</Alert.Heading>
            <p>{props.errorMessage}</p>
        </Alert>
    );
}

function LogoIcon(props) {
    return (
        <OverlayTrigger placement='bottom'
            overlay={
                <Tooltip><strong>Homepage</strong></Tooltip>
            }>
            <Link to='/' className='navButton'>
                <PencilSquare fontSize='2.5em' />
                <span style={{ fontSize: '1.5em', fontWeight: 'bold' }}> Surveys </span>
            </Link>
        </OverlayTrigger>
    );
}

function LoginIcon(props) {
    return (
        <OverlayTrigger placement='bottom'
            overlay={
                <Tooltip><strong>Log in</strong></Tooltip>
            }>
            <Link to='/login' className='navButton'>
                <span style={{ fontSize: '1.5em', fontWeight: 'bold' }}> Login </span>
                <BoxArrowInRight fontSize='2.5em' />
            </Link>
        </OverlayTrigger>
    );
}

function LogoutIcon(props) {
    return (
        <OverlayTrigger placement='bottom'
            overlay={
                <Tooltip><strong>Log out</strong></Tooltip>
            }>
            <Button variant='link' className='navButton' onClick={props.doLogOut}>
                <span style={{ fontSize: '1.5em', fontWeight: 'bold', cursor: 'pointer' }}> Logout </span>
                <BoxArrowRight fontSize='2.5em' />
            </Button>
        </OverlayTrigger>
    );
}

function TrashIcon(props) {
    return (
        <OverlayTrigger placement='top'
            overlay={
                <Tooltip><strong>Delete</strong></Tooltip>
            }>
            <Trash fontSize='1.5em' />
        </OverlayTrigger>
    );
}

function StarIcon(props) {
    return (
        <OverlayTrigger placement='top'
            overlay={
                <Tooltip><strong>Mandatory</strong></Tooltip>
            }>
            <StarFill />
        </OverlayTrigger>
    );
}

function ArrowUpIcon(props) {
    return (
        <OverlayTrigger placement='top'
            overlay={
                <Tooltip><strong>Move Up</strong></Tooltip>
            }>
            <ArrowUp fontSize='1.5em' />
        </OverlayTrigger>
    );
}

function ArrowDownIcon(props) {
    return (
        <OverlayTrigger placement='top'
            overlay={
                <Tooltip><strong>Move Down</strong></Tooltip>
            }>
            <ArrowDown fontSize='1.5em' />
        </OverlayTrigger>
    );
}

function ArrowLeftIcon(props) {
    return (
        <OverlayTrigger placement='right'
            overlay={
                <Tooltip><strong>Previous User</strong></Tooltip>
            }>
            <ArrowLeft fontSize='1.5em' />
        </OverlayTrigger>
    );
}

function ArrowRightIcon(props) {
    return (
        <OverlayTrigger placement='left'
            overlay={
                <Tooltip><strong>Next User</strong></Tooltip>
            }>
            <ArrowRight fontSize='1.5em' />
        </OverlayTrigger>
    );
}

export { ErrorAlert, LogoIcon, LoginIcon, LogoutIcon, TrashIcon, StarIcon, ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon };