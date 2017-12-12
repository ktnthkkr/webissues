<?php
/**************************************************************************
* This file is part of the WebIssues Server program
* Copyright (C) 2006 Michał Męciński
* Copyright (C) 2007-2017 WebIssues Team
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
**************************************************************************/

if ( !defined( 'WI_VERSION' ) ) die( -1 );

class Common_Application extends System_Web_Application
{
    protected function __construct( $pageClass )
    {
        parent::__construct( $pageClass );
    }

    protected function preparePage()
    {
        parent::preparePage();

        $this->page->getView()->setDecoratorClass( 'Common_PageLayout' );
    }

    protected function handleSetupException( $exception )
    {
        if ( $this->request->isRelativePathUnder( '/common/errors' ) )
            return;

        if ( $exception->getCode() == System_Core_SetupException::SiteConfigNotFound && $this->request->isRelativePath( '/admin/setup/install.php' ) )
            return;

        if ( $exception->getCode() == System_Core_SetupException::DatabaseNotUpdated && $this->request->isRelativePath( '/admin/setup/update.php' ) )
            return;

        $this->handleException( $exception );
        exit;
    }

    protected function displayErrorPage()
    {
        $exception = $this->getFatalError();

        if ( is_a( $exception, 'System_Core_SetupException' ) )
            $errorPage = System_Web_Component::createComponent( 'Common_Errors_Setup' );
        else if ( $this->isDebugInfoEnabled() )
            $errorPage = System_Web_Component::createComponent( 'Common_Errors_Debug' );
        else
            $errorPage = System_Web_Component::createComponent( 'Common_Errors_General' );

        $this->response->setContentType( 'text/html; charset=UTF-8' );

        $content = $errorPage->run();
        $this->response->setContent( $content );

        $this->response->send();
    }

    public function getManualUrl()
    {
        $language = $this->translator->getLanguage( System_Core_Translator::UserLanguage );

        while ( $language != '' ) {
            $url = '/doc/' . $language . '/index.html';

            if ( file_exists( WI_ROOT_DIR . $url ) )
                return $url;

            $pos = strrpos( $language, '_' );
            if ( $pos === false )
                break;

            $language = substr( $language, 0, $pos );
        }

        return '/doc/en/index.html';
    }
}