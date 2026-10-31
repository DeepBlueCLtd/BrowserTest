<?xml version="1.0" encoding="UTF-8"?>
<!--
    Publication question total (SRD 013 SCO-05).

    Counts the body rows of every qd-quiz simple table in the topics the map
    references, during the Oxygen publish, so no step is needed afterwards.
    customHeader.xsl writes the result into the hidden #qd-question-total span,
    and the student panel then reads "12 of 40 answered".

    The map comes from the DITA-OT input.map.url parameter. If a stage does not
    receive it, the span stays empty and the panel shows "12 answered" without
    a total. The qd-question-total scenario parameter, when set to a number,
    overrides the count.
-->
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:oxyf="http://www.oxygenxml.com/functions"
    xmlns:qd="http://deepbluec.com/ns/sonar-quiz"
    exclude-result-prefixes="#all" version="2.0">

    <!-- URL of the (preprocessed) map; supplied by DITA-OT where available -->
    <xsl:param name="input.map.url" select="''"/>

    <!-- Quiz rows in one topic document -->
    <xsl:function name="qd:count-quiz-rows" as="xs:integer">
        <xsl:param name="doc" as="document-node()"/>
        <xsl:sequence select="count($doc//*[contains(@class, ' topic/simpletable ')]
            [tokenize(string(@outputclass), '\s+') = 'qd-quiz']
            /*[contains(@class, ' topic/strow ')])"/>
    </xsl:function>

    <!-- Distinct topic files the map references, as absolute URIs -->
    <xsl:function name="qd:map-topic-uris" as="xs:string*">
        <xsl:param name="map" as="document-node()"/>
        <xsl:sequence select="distinct-values(
            for $ref in $map//*[contains(@class, ' map/topicref ')][@href]
                [not(@scope = ('external', 'peer'))]
                [not(@format) or @format = 'dita']
                [not(@processing-role = 'resource-only')]
            return string(resolve-uri(substring-before(concat($ref/@href, '#'), '#'), base-uri($ref))))"/>
    </xsl:function>

    <!-- Total as text, or empty when it cannot be determined -->
    <xsl:variable name="qd:question-total" as="xs:string">
        <xsl:variable name="manual" select="normalize-space(string(oxyf:getParameter('qd-question-total')))"/>
        <xsl:variable name="mapUrl" select="normalize-space(string($input.map.url))"/>
        <xsl:choose>
            <xsl:when test="matches($manual, '^[0-9]+$')">
                <xsl:sequence select="$manual"/>
            </xsl:when>
            <xsl:when test="$mapUrl != '' and doc-available($mapUrl)">
                <xsl:variable name="count" select="sum(
                    for $uri in qd:map-topic-uris(doc($mapUrl))
                    return if (doc-available($uri)) then qd:count-quiz-rows(doc($uri)) else 0)"/>
                <xsl:sequence select="if ($count gt 0) then string($count) else ''"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:sequence select="''"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:variable>

</xsl:stylesheet>
