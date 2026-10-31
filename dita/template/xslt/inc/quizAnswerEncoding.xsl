<?xml version="1.0" encoding="UTF-8"?>
<!--
    Publish-time encoding of quiz answers (SRD 013 WP3, ANS-04 to ANS-07).

    The Answer cell of every qd-quiz simple table, and a Detail cell that holds
    only a numeric tolerance, are written to the HTML as "qd1:" followed by a
    keyed letter substitution of the value. MCQ option lists stay readable.
    Plain answers then appear in neither the published pages nor anything built
    from them, such as a search index. The runtime decodes the values with the
    key published in #qd-answer-key (see customHeader.xsl).

    This is obfuscation, not encryption: the key is in the page. It stops a
    student reading answers in view-source or a text editor at a glance.

    Parameter qd-answer-key: 13 different capital letters, mapped in order to
    the characters 0123456789-+. Empty means the built-in default key.
-->
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:oxyf="http://www.oxygenxml.com/functions"
    xmlns:qd="http://deepbluec.com/ns/sonar-quiz"
    exclude-result-prefixes="#all" version="2.0">

    <!-- Characters an answer may contain, in the order the key maps them -->
    <xsl:variable name="qd:alphabet" as="xs:string" select="'0123456789-+.'"/>

    <!-- Used when qd-answer-key is not set. Must match nothing in particular;
         publications should set their own key. -->
    <xsl:variable name="qd:default-key" as="xs:string" select="'KXMQBRTLHZWDP'"/>

    <!-- Marks an encoded value; the digit is the encoding version -->
    <xsl:variable name="qd:prefix" as="xs:string" select="'qd1:'"/>

    <!-- Whether a key is 13 different capital letters -->
    <xsl:function name="qd:is-valid-key" as="xs:boolean">
        <xsl:param name="key" as="xs:string"/>
        <xsl:sequence select="matches($key, '^[A-Z]{13}$')
            and count(distinct-values(string-to-codepoints($key))) = 13"/>
    </xsl:function>

    <!-- The key in effect: the qd-answer-key parameter, or the default -->
    <xsl:function name="qd:answer-key" as="xs:string">
        <xsl:variable name="configured" select="normalize-space(string(oxyf:getParameter('qd-answer-key')))"/>
        <xsl:choose>
            <xsl:when test="$configured = ''">
                <xsl:sequence select="$qd:default-key"/>
            </xsl:when>
            <xsl:when test="qd:is-valid-key($configured)">
                <xsl:sequence select="$configured"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:message terminate="yes">
                    <xsl:text>qd-answer-key must be 13 different capital letters A-Z, got "</xsl:text>
                    <xsl:value-of select="$configured"/>
                    <xsl:text>"</xsl:text>
                </xsl:message>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:function>

    <!--
        1-based column of the qd-quiz simple-table body cell containing $node,
        or 0 when $node is not inside one.
    -->
    <xsl:function name="qd:quiz-cell-column" as="xs:integer">
        <xsl:param name="node" as="node()"/>
        <xsl:variable name="entry" select="$node/ancestor-or-self::*[contains(@class, ' topic/stentry ')][1]"/>
        <xsl:variable name="row" select="$entry/parent::*[contains(@class, ' topic/strow ')]"/>
        <xsl:variable name="table" select="$row/parent::*[contains(@class, ' topic/simpletable ')]"/>
        <xsl:sequence select="
            if ($row and $table and tokenize(string($table/@outputclass), '\s+') = 'qd-quiz')
            then count($entry/preceding-sibling::*[contains(@class, ' topic/stentry ')]) + 1
            else 0"/>
    </xsl:function>

    <!-- Whether a Detail cell holds only a number (a numeric tolerance) -->
    <xsl:function name="qd:is-numeric-entry" as="xs:boolean">
        <xsl:param name="entry" as="element()?"/>
        <xsl:variable name="value" select="normalize-space(string($entry))"/>
        <xsl:sequence select="exists($entry) and not($entry/*) and $value != ''
            and translate($value, $qd:alphabet, '') = ''"/>
    </xsl:function>

    <!-- Encode one answer value, stopping the build on characters the key cannot map -->
    <xsl:function name="qd:encode" as="xs:string">
        <xsl:param name="text" as="xs:string"/>
        <xsl:param name="context" as="node()"/>
        <xsl:variable name="value" select="normalize-space($text)"/>
        <xsl:if test="translate($value, $qd:alphabet, '') != ''">
            <xsl:message terminate="yes">
                <xsl:text>Quiz answer "</xsl:text>
                <xsl:value-of select="$value"/>
                <xsl:text>" in topic "</xsl:text>
                <xsl:value-of select="($context/ancestor::*[contains(@class, ' topic/topic ')][1]/@id, '?')[1]"/>
                <xsl:text>" may contain only digits, a sign and a decimal point, so it cannot be encoded. Fix the answer or move text into the Detail column.</xsl:text>
            </xsl:message>
        </xsl:if>
        <xsl:sequence select="concat($qd:prefix, translate($value, $qd:alphabet, qd:answer-key()))"/>
    </xsl:function>

    <!-- Answer column: always encoded -->
    <xsl:template match="text()[normalize-space(.) != ''][qd:quiz-cell-column(.) = 2]" priority="20">
        <xsl:value-of select="qd:encode(., .)"/>
    </xsl:template>

    <!-- Detail column: encoded only when it is a numeric tolerance -->
    <xsl:template match="text()[normalize-space(.) != ''][qd:quiz-cell-column(.) = 3]
        [qd:is-numeric-entry(ancestor::*[contains(@class, ' topic/stentry ')][1])]" priority="20">
        <xsl:value-of select="qd:encode(., .)"/>
    </xsl:template>

</xsl:stylesheet>
