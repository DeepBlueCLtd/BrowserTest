<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:toc="http://www.oxygenxml.com/ns/webhelp/toc" xmlns:index="http://www.oxygenxml.com/ns/webhelp/index" xmlns:oxygen="http://www.oxygenxml.com/functions" xmlns:d="http://docbook.org/ns/docbook" xmlns:whc="http://www.oxygenxml.com/webhelp/components" xmlns="http://www.w3.org/1999/xhtml" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:oxyf="http://www.oxygenxml.com/functions" exclude-result-prefixes="#all" version="2.0">


    <xsl:template match="*:header[contains(@class, 'wh_header_protection')]" mode="copy_template">
        <xsl:if test="oxyf:getParameter('webhelp.show.protection') = 'yes'">
            <xsl:copy>
                <xsl:copy-of select="@*"/>
                <xsl:if test="oxyf:getParameter('webhelp.protection.background.color') != ''">
                    <xsl:attribute name="style">
                        <xsl:text>background-color:</xsl:text>
                        <xsl:value-of select="oxyf:getParameter('webhelp.protection.background.color')"/>
                    </xsl:attribute>
                </xsl:if>
                <div class="header-container mx-auto">
                    <xsl:value-of select="oxyf:getParameter('webhelp.protection.text')"/>
                </div>
            </xsl:copy>
        </xsl:if>
    </xsl:template>

    <!-- Inject instructor password hash into the main header -->
    <xsl:template match="*:header[contains(@class, 'wh_header') and contains(@class, 'c-nav-bar')]" mode="copy_template">
        <xsl:copy>
            <xsl:copy-of select="@*"/>
            <xsl:apply-templates mode="copy_template"/>
            <!-- Hidden span with instructor password hash parameter -->
            <span id="instructor.password.hash" style="display:none;">
                <xsl:value-of select="oxyf:getParameter('instructor.password.hash')"/>
            </span>
        </xsl:copy>
    </xsl:template>

</xsl:stylesheet>
